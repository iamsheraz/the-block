// Build-time AI condition summary enrichment for The Block.
//
// Reads data/vehicles.json, calls Claude Haiku 4.5 once per vehicle, and writes
// a two-sentence ai_summary back into the JSON. The Anthropic API key is read
// from process.env.ANTHROPIC_API_KEY in this script only; no client code ever
// imports it.
//
// Flags:
//   --force   regenerate ai_summary for every vehicle (otherwise idempotent)
//   --check   re-validate every vehicle's ai_summary against the compliance
//             rules and exit non-zero on any missing or non-compliant summary.
//             Used by CI to gate the committed dataset. Makes no API calls.

import { readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '..', 'data', 'vehicles.json');
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 800;

const SYSTEM_PROMPT = `You write two-sentence condition summaries for used vehicles in a wholesale
auction listing. Given the vehicle's condition fields, write a summary that
helps a professional buyer assess risk in under 30 seconds.

Rules:
1. Exactly two sentences.
2. Describe condition (grade context, mileage context, damage themes).
3. Do NOT include dollar amounts, repair-cost estimates, market values,
   appraisal claims, or any numeric figures other than the vehicle's year,
   condition grade, or odometer mileage.
4. Do NOT predict resale or wholesale price.
5. Mechanical concerns must be named generically — "reconditioning work,"
   "diagnosis recommended" — never quantified by cost.

Output only the two-sentence summary. No preamble, no quotes, no labels.`;

function parseArgs(argv) {
  return {
    force: argv.includes('--force'),
    check: argv.includes('--check'),
  };
}

async function loadVehicles() {
  const raw = await readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// Atomic write: stage to a sibling `.tmp` file and rename into place so a
// crash mid-write can't truncate the committed dataset.
async function saveVehicles(vehicles) {
  const json = `${JSON.stringify(vehicles, null, 2)}\n`;
  const tmpPath = `${DATA_PATH}.tmp`;
  await writeFile(tmpPath, json, 'utf8');
  await rename(tmpPath, DATA_PATH);
}

function vehicleLabel(v) {
  return `${v.year} ${v.make} ${v.model} (${v.id.slice(0, 8)})`;
}

// AC5 — compliance validator. Runs at generation time AND at `--check` time,
// so a hand-edited or stale summary can't silently slip past the CI gate.
const FORBIDDEN_PHRASES = [
  'estimated cost',
  'market value',
  'appraised',
  'appraisal',
  'resale value',
  'wholesale price',
];

// Any currency symbol — USD, GBP, EUR, JPY/CNY, fullwidth variants — counts
// as price leakage. A literal-`$` check missed €, £, ¥, ￥, ￡, etc.
const CURRENCY_SYMBOLS = /[$¢£¥₤€＄￠￡￥￦]/;

// Abbreviations whose internal period would otherwise inflate the
// sentence-terminator count.
const ABBREVIATIONS = [
  'e.g', 'i.e', 'etc', 'vs', 'cf', 'approx',
  'mr', 'mrs', 'ms', 'dr', 'st', 'jr', 'sr',
  'inc', 'ltd', 'co', 'no', 'pp', 'vol', 'fig',
];

function countSentences(text) {
  let cleaned = text;
  // Mask decimal numbers ("3.5L", "grade 1.9") so the inner period doesn't
  // register as a terminator.
  cleaned = cleaned.replace(/(\d)\.(\d)/g, '$1·$2');
  // Mask known abbreviations case-insensitively. The trailing period becomes
  // a middle dot so the terminator regex skips it.
  for (const abbr of ABBREVIATIONS) {
    const escaped = abbr.replace(/\./g, '\\.');
    cleaned = cleaned.replace(
      new RegExp(`\\b${escaped}\\.`, 'gi'),
      (match) => `${match.slice(0, -1)}·`,
    );
  }
  const terminators = cleaned.match(/[.!?](\s|$)/g) ?? [];
  return terminators.length;
}

export function validateSummary(text, vehicle) {
  if (!text || typeof text !== 'string') {
    return { ok: false, reason: 'empty summary' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty after trim' };
  }
  if (CURRENCY_SYMBOLS.test(trimmed)) {
    return { ok: false, reason: 'contains currency symbol' };
  }
  const lower = trimmed.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) {
      return { ok: false, reason: `contains forbidden phrase "${phrase}"` };
    }
  }
  // Reject any 4+ digit number that isn't the vehicle's year, the odometer
  // reading, a digit token in the model name (e.g. "1500" for a Ram 1500), or
  // immediately followed by "km" (rounded-mileage context like
  // "sub-40,000 km"). Comma-formatted figures like "18,500" are normalized
  // to bare digits so they can't slip past the word-boundary check.
  const yearStr = String(vehicle.year);
  const odoStr = String(vehicle.odometer_km);
  const modelDigits = vehicle.model?.match(/\d{3,}/g) ?? [];
  const numericTokenRe = /\b\d{1,3}(?:,\d{3})+\b|\b\d{4,}\b/g;
  let m = numericTokenRe.exec(trimmed);
  while (m !== null) {
    const token = m[0];
    const digits = token.replace(/,/g, '');
    if (digits.length >= 4 &&
      digits !== yearStr &&
      digits !== odoStr &&
      !modelDigits.includes(digits)
    ) {
      // Allow mileage-context numbers (followed by km / kilometers / miles).
      const after = trimmed.slice(m.index + token.length, m.index + token.length + 14);
      if (!/^[\s-]*(?:km|kilometers?|kilometres?|mi|miles)\b/i.test(after)) {
        return { ok: false, reason: `disallowed numeric figure "${token}"` };
      }
    }
    m = numericTokenRe.exec(trimmed);
  }
  // AC2 — exactly two sentences. Abbreviations and decimals are masked above
  // so they don't inflate the count.
  const sentenceCount = countSentences(trimmed);
  if (sentenceCount !== 2) {
    return { ok: false, reason: `expected 2 sentences, got ${sentenceCount}` };
  }
  // Reject truncated copy that lacks terminal punctuation — would otherwise
  // squeak past the count check if max_tokens cuts mid-word.
  if (!/[.!?]$/.test(trimmed)) {
    return { ok: false, reason: 'missing terminal punctuation' };
  }
  return { ok: true };
}

function buildUserMessage(v) {
  return [
    `Year: ${v.year}`,
    `Make/Model: ${v.make} ${v.model} ${v.trim}`.trim(),
    `Odometer: ${v.odometer_km.toLocaleString('en-CA')} km`,
    `Title status: ${v.title_status}`,
    `Condition grade: ${v.condition_grade} out of 5`,
    `Condition report: ${v.condition_report}`,
    `Damage notes: ${v.damage_notes.length > 0 ? v.damage_notes.join('; ') : 'none'}`,
  ].join('\n');
}

async function generateSummary(client, vehicle) {
  let lastFailure = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 220,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(vehicle) }],
      });
      const block = response.content.find((c) => c.type === 'text');
      const text = block ? block.text.trim() : '';
      const verdict = validateSummary(text, vehicle);
      if (verdict.ok) {
        return text;
      }
      lastFailure = `validation failed: ${verdict.reason}`;
      console.warn(`  ↻ attempt ${attempt}/${MAX_RETRIES} rejected: ${verdict.reason}`);
    } catch (err) {
      lastFailure = err?.message ?? String(err);
      console.warn(`  ↻ attempt ${attempt}/${MAX_RETRIES} API error: ${lastFailure}`);
    }
    if (attempt < MAX_RETRIES) {
      const delay = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`exhausted retries: ${lastFailure ?? 'unknown error'}`);
}

async function runCheck() {
  const vehicles = await loadVehicles();
  const missing = [];
  const invalid = [];
  for (const v of vehicles) {
    if (typeof v.ai_summary !== 'string' || v.ai_summary.trim().length === 0) {
      missing.push(v);
      continue;
    }
    const verdict = validateSummary(v.ai_summary, v);
    if (!verdict.ok) {
      invalid.push({ vehicle: v, reason: verdict.reason });
    }
  }
  if (missing.length === 0 && invalid.length === 0) {
    console.log(`✓ all ${vehicles.length} vehicles have a compliant ai_summary`);
    return 0;
  }
  if (missing.length > 0) {
    console.error(`✗ ${missing.length} of ${vehicles.length} vehicles missing ai_summary:`);
    for (const v of missing.slice(0, 10)) {
      console.error(`  - ${vehicleLabel(v)}`);
    }
    if (missing.length > 10) {
      console.error(`  …and ${missing.length - 10} more`);
    }
  }
  if (invalid.length > 0) {
    console.error(`✗ ${invalid.length} of ${vehicles.length} vehicles have non-compliant ai_summary:`);
    for (const { vehicle, reason } of invalid.slice(0, 10)) {
      console.error(`  - ${vehicleLabel(vehicle)}: ${reason}`);
    }
    if (invalid.length > 10) {
      console.error(`  …and ${invalid.length - 10} more`);
    }
  }
  return 1;
}

async function runEnrich({ force }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set. Add it to .env or your shell.');
    return 1;
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const vehicles = await loadVehicles();
  const targets = force
    ? vehicles
    : vehicles.filter(
        (v) => typeof v.ai_summary !== 'string' || v.ai_summary.trim().length === 0,
      );

  if (targets.length === 0) {
    console.log(`all ${vehicles.length} vehicles already enriched, skipping (use --force to redo)`);
    return 0;
  }

  console.log(`enriching ${targets.length} of ${vehicles.length} vehicles…`);
  const failed = [];
  let done = 0;

  for (const vehicle of targets) {
    const label = vehicleLabel(vehicle);
    try {
      const summary = await generateSummary(client, vehicle);
      vehicle.ai_summary = summary;
      done += 1;
      console.log(`  ✓ [${done}/${targets.length}] ${label}`);
      // Persist after each success so a crash mid-run doesn't lose progress.
      await saveVehicles(vehicles);
    } catch (err) {
      failed.push({ id: vehicle.id, label, error: err?.message ?? String(err) });
      console.error(`  ✗ [${done + failed.length}/${targets.length}] ${label} — ${err?.message}`);
    }
  }

  console.log(`done: ${done} enriched, ${failed.length} failed`);
  if (failed.length > 0) {
    console.error('failures:');
    for (const f of failed) {
      console.error(`  - ${f.label}: ${f.error}`);
    }
    return 1;
  }

  // Final coverage gate — every vehicle must have ai_summary.
  const stillMissing = vehicles.filter(
    (v) => typeof v.ai_summary !== 'string' || v.ai_summary.trim().length === 0,
  );
  if (stillMissing.length > 0) {
    console.error(`coverage gate failed: ${stillMissing.length} vehicles still missing ai_summary`);
    return 1;
  }
  return 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.check && args.force) {
    console.error('--check and --force are mutually exclusive');
    return 2;
  }
  return args.check ? await runCheck() : await runEnrich({ force: args.force });
}

// Skip main when imported (e.g. by tests). pathToFileURL normalizes the entry
// path into the same file:// URL form as import.meta.url, so the comparison
// survives Windows path quirks (npm wrappers, drive-letter casing, symlinks).
const entryHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entryHref) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
