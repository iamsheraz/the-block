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

  it('rejects empty input', () => {
    expect(validateSummary('', FIXTURES.clean).ok).toBe(false);
    expect(validateSummary('   ', FIXTURES.clean).ok).toBe(false);
  });
});
