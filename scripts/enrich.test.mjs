import { describe, expect, it } from 'vitest';
import { validateSummary } from './enrich.mjs';

const FIXTURES = {
  clean: {
    year: 2024,
    odometer_km: 24534,
    title_status: 'clean',
    condition_grade: 4,
  },
  rebuilt: {
    year: 2019,
    odometer_km: 142800,
    title_status: 'rebuilt',
    condition_grade: 3,
  },
  salvage: {
    year: 2017,
    odometer_km: 188210,
    title_status: 'salvage',
    condition_grade: 2,
  },
};

describe('validateSummary', () => {
  it('accepts a compliant two-sentence summary on a clean vehicle', () => {
    const text =
      'Grade-4 unit with light cosmetic wear and no damage notes on file. Drives clean — no reconditioning work flagged in the inspection.';
    expect(validateSummary(text, FIXTURES.clean)).toEqual({ ok: true });
  });

  it('accepts compliant copy that references mileage and grade', () => {
    const text =
      'Grade-3 rebuilt-title vehicle with 142,800 km on the odometer and recorded prior structural repairs. Diagnosis recommended on driveline noises noted at inspection.';
    expect(validateSummary(text, FIXTURES.rebuilt)).toEqual({ ok: true });
  });

  it('rejects a summary containing a dollar sign', () => {
    const text = 'Clean grade-4 unit. Light reconditioning ($500) recommended.';
    const result = validateSummary(text, FIXTURES.clean);
    expect(result.ok).toBe(false);
  });

  it('rejects a summary containing "estimated cost"', () => {
    const text = 'Solid grade-3 unit. Estimated cost of repairs not provided.';
    const result = validateSummary(text, FIXTURES.rebuilt);
    expect(result.ok).toBe(false);
  });

  it('rejects a summary containing "market value"', () => {
    const text = 'Salvage-title pickup. Market value below comparable units.';
    const result = validateSummary(text, FIXTURES.salvage);
    expect(result.ok).toBe(false);
  });

  it('rejects a summary containing "appraised at" or "appraisal"', () => {
    expect(validateSummary('Grade-4 unit. Appraised at top of range.', FIXTURES.clean).ok).toBe(
      false,
    );
    expect(validateSummary('Grade-4 unit. Independent appraisal favorable.', FIXTURES.clean).ok)
      .toBe(false);
  });

  it('rejects four-digit numbers other than year or odometer', () => {
    const text = 'Grade-4 unit. Resale projected around 18500 next quarter.';
    expect(validateSummary(text, FIXTURES.clean).ok).toBe(false);
  });

  it('allows the vehicle year inside the summary', () => {
    const text =
      'A 2024 grade-4 unit with light cosmetic wear and no damage on file. Drives clean per inspection.';
    expect(validateSummary(text, FIXTURES.clean)).toEqual({ ok: true });
  });

  it('allows model-name digit tokens (Ram 1500, Silverado 2500)', () => {
    const ram = { year: 2023, odometer_km: 64210, title_status: 'clean', condition_grade: 4, model: 'Ram 1500' };
    const text = 'This Ram 1500 is a grade-4 unit with light cosmetic wear. Drives clean per inspection.';
    expect(validateSummary(text, ram)).toEqual({ ok: true });

    const silverado = {
      year: 2022,
      odometer_km: 92100,
      title_status: 'clean',
      condition_grade: 3,
      model: 'Silverado 2500',
    };
    const text2 = 'Grade-3 Silverado 2500 with steady highway mileage. Reconditioning work flagged on the bedliner.';
    expect(validateSummary(text2, silverado)).toEqual({ ok: true });
  });

  it('rejects more than two sentences', () => {
    const text =
      'Clean grade-4 unit. Light wear noted. Drives clean per inspection. No mechanical flags.';
    const result = validateSummary(text, FIXTURES.clean);
    expect(result.ok).toBe(false);
  });

  it('rejects a one-sentence summary (AC2 — exactly two)', () => {
    const text = 'Grade-4 unit with light cosmetic wear and no damage notes on file.';
    expect(validateSummary(text, FIXTURES.clean).ok).toBe(false);
  });

  it('rejects copy that lacks terminal punctuation (truncated by max_tokens)', () => {
    const text = 'Grade-4 unit with light cosmetic wear. Drives clean per inspection';
    expect(validateSummary(text, FIXTURES.clean).ok).toBe(false);
  });

  it('rejects comma-formatted prices that bypass the four-digit boundary', () => {
    const text = 'Grade-4 unit. Resale around 18,500 next quarter.';
    expect(validateSummary(text, FIXTURES.clean).ok).toBe(false);
  });

  it('allows comma-formatted mileage that exactly matches the odometer', () => {
    const text =
      'Grade-3 rebuilt-title vehicle with 142,800 km on the odometer. Diagnosis recommended on driveline noises.';
    expect(validateSummary(text, FIXTURES.rebuilt)).toEqual({ ok: true });
  });

  it('allows rounded mileage when followed by km, even if the digits do not match the odometer', () => {
    const text = 'Grade-4 unit with sub-40,000 km on the clock. Drives clean per inspection.';
    expect(validateSummary(text, FIXTURES.clean)).toEqual({ ok: true });
  });

  it('rejects four-digit substring leakage that the old odometer-includes check let through', () => {
    // odometer 24534 — fabricated "2453" no longer slips through as a substring.
    const text = 'Grade-4 unit. Light reconditioning at 2453 dollars projected.';
    expect(validateSummary(text, FIXTURES.clean).ok).toBe(false);
  });

  it('rejects non-USD currency symbols', () => {
    expect(validateSummary('Grade-4 unit. Worth €500 in parts.', FIXTURES.clean).ok).toBe(false);
    expect(validateSummary('Grade-4 unit. Worth £500 in parts.', FIXTURES.clean).ok).toBe(false);
    expect(validateSummary('Grade-4 unit. Worth ¥500 in parts.', FIXTURES.clean).ok).toBe(false);
  });

  it('counts decimals and abbreviations correctly when measuring sentences', () => {
    // "3.5L" and "i.e." should NOT count as terminators.
    const text = 'Grade-4 unit with a 3.5L V6, i.e. the base trim configuration. Drives clean.';
    expect(validateSummary(text, FIXTURES.clean)).toEqual({ ok: true });
  });

  it('rejects "Appraised favorably" via bare "appraised" rule', () => {
    expect(validateSummary('Grade-4 unit. Appraised favorably.', FIXTURES.clean).ok).toBe(false);
  });

  it('rejects empty input', () => {
    expect(validateSummary('', FIXTURES.clean).ok).toBe(false);
    expect(validateSummary('   ', FIXTURES.clean).ok).toBe(false);
  });
});
