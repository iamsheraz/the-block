// Build-time AI condition summary enrichment for The Block.
//
// Reads data/vehicles.json, calls Claude Haiku 4.5 once per vehicle, and writes
// a two-sentence ai_summary back into the JSON. The Anthropic API key is read
// from process.env.ANTHROPIC_API_KEY in this script only; no client code ever
// imports it.
//
// Flags:
//   --force   regenerate ai_summary for every vehicle (otherwise idempotent)
//   --check   verify every vehicle has an ai_summary, exit non-zero if any
//             are missing. Used by CI to gate the committed dataset.
//             Makes no API calls.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
   appraisal claims, or any numeric figures other than the grade or mileage.
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

async function saveVehicles(vehicles) {
  const json = `${JSON.stringify(vehicles, null, 2)}\n`;
  await writeFile(DATA_PATH, json, 'utf8');
}

function vehicleLabel(v) {
  return `${v.year} ${v.make} ${v.model} (${v.id.slice(0, 8)})`;
}

// AC5 — compliance validator. Rejects price-claim leakage so the prompt
// instructions can't silently regress.
const FORBIDDEN_PHRASES = [
  'estimated cost',
  'market value',
  'appraised at',
  'appraisal',
  'resale value',
  'wholesale price',
];

export function validateSummary(text, vehicle) {
  if (!text || typeof text !== 'string') {
    return { ok: false, reason: 'empty summary' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty after trim' };
  }
  if (trimmed.includes('$')) {
    return { ok: false, reason: 'contains $ character' };
  }
  const lower = trimmed.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) {
      return { ok: false, reason: `contains forbidden phrase "${phrase}"` };
    }
  }
  // Reject any four-digit number that isn't the vehicle's year, part of the
  // odometer reading, or a digit token already in the model name (e.g. "1500"
  // for a Ram 1500, "2500" for a Silverado 2500). Mileage is allowed in
  // whatever form Claude writes it ("24,534 km" or "24534 km").
  const yearStr = String(vehicle.year);
  const odoStr = String(vehicle.odometer_km);
  const modelDigits = vehicle.model?.match(/\d{3,}/g) ?? [];
  const fourDigitMatches = trimmed.match(/\b\d{4,}\b/g) ?? [];
  for (const match of fourDigitMatches) {
    if (match === yearStr) continue;
    if (odoStr.includes(match) || match.includes(odoStr)) continue;
    if (modelDigits.includes(match)) continue;
    return { ok: false, reason: `disallowed numeric figure "${match}"` };
  }
  // AC2 — two sentences max. Tolerate Oxford abbreviations by counting
  // terminal punctuation followed by a space or end of string.
  const sentenceTerminators = trimmed.match(/[.!?](\s|$)/g) ?? [];
  if (sentenceTerminators.length > 2) {
    return { ok: false, reason: `more than two sentences (${sentenceTerminators.length})` };
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
  const missing = vehicles.filter(
    (v) => typeof v.ai_summary !== 'string' || v.ai_summary.trim().length === 0,
  );
  if (missing.length === 0) {
    console.log(`✓ all ${vehicles.length} vehicles have ai_summary`);
    return 0;
  }
  console.error(`✗ ${missing.length} of ${vehicles.length} vehicles missing ai_summary:`);
  for (const v of missing.slice(0, 10)) {
    console.error(`  - ${vehicleLabel(v)}`);
  }
  if (missing.length > 10) {
    console.error(`  …and ${missing.length - 10} more`);
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
    } catch (err) {
      failed.push({ id: vehicle.id, label, error: err?.message ?? String(err) });
      console.error(`  ✗ [${done + failed.length}/${targets.length}] ${label} — ${err?.message}`);
    }
    // Persist after each success so a crash mid-run doesn't lose progress.
    await saveVehicles(vehicles);
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
  const code = args.check ? await runCheck() : await runEnrich({ force: args.force });
  process.exit(code);
}

// Skip main when imported (e.g. by tests). import.meta.url comparison handles
// cross-platform Windows path quirks via fileURLToPath.
const invokedDirectly = fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '');
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
