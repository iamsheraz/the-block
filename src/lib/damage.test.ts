import { describe, expect, it } from 'vitest';
import { classifyDamageSeverity, classifyDamageType, classifyNote, mapToRegion } from './damage';

describe('classifyNote', () => {
  it('classifies "Scratch on liftgate" as body', () => {
    expect(classifyNote('Scratch on liftgate')).toBe('body');
  });

  it('classifies "Transmission slips in 3rd" as mechanical', () => {
    expect(classifyNote('Transmission slips in 3rd')).toBe('mechanical');
  });

  it('classifies "AC compressor intermittent" as mechanical', () => {
    expect(classifyNote('AC compressor intermittent')).toBe('mechanical');
  });

  it('classifies "Minor rust on wheel wells" as body', () => {
    expect(classifyNote('Minor rust on wheel wells')).toBe('body');
  });

  it('classifies "Check engine light - catalytic converter code" as mechanical', () => {
    expect(classifyNote('Check engine light - catalytic converter code')).toBe('mechanical');
  });

  it('classifies "Dent on tailgate" as body', () => {
    expect(classifyNote('Dent on tailgate')).toBe('body');
  });
});

describe('mapToRegion', () => {
  it('places "rust on wheel wells" at the rear-wheel region', () => {
    expect(mapToRegion('Minor rust on wheel wells').region).toBe('wheels-rear');
  });

  it('places a driver-rear wheel-well note at wheel-rl', () => {
    expect(mapToRegion('Rust on driver-rear wheel well').region).toBe('wheel-rl');
  });

  it('places a liftgate scratch at the liftgate region', () => {
    expect(mapToRegion('Scratch on liftgate').region).toBe('liftgate');
  });

  it('places a hail-damage roof note at the roof region', () => {
    expect(mapToRegion('Light hail damage on roof').region).toBe('roof');
  });

  it('places a windshield chip at the windshield region', () => {
    expect(mapToRegion('Chip in windshield (passenger side)').region).toBe('windshield');
  });

  it('places an upholstery tear at the interior region', () => {
    expect(mapToRegion('Small tear in rear seat upholstery').region).toBe('interior');
  });

  it('falls back to "other" for ambiguous notes', () => {
    expect(mapToRegion('Unspecified surface scuff').region).toBe('other');
  });

  it('returns numeric svg coordinates', () => {
    const point = mapToRegion('Scratch on liftgate');
    expect(typeof point.x).toBe('number');
    expect(typeof point.y).toBe('number');
  });

  it('prefers the front-bumper rule over the headlight rule when both terms appear', () => {
    expect(mapToRegion('Crack in front bumper near headlight').region).toBe('front');
  });

  it('places a generic headlight note at the hood region', () => {
    expect(mapToRegion('Headlight housing cloudy').region).toBe('hood');
  });
});

describe('classifyNote (flood damage carved out)', () => {
  it('classifies a flood-damage note as body, since the title_status field carries the brand', () => {
    expect(classifyNote('Flood damage noted in carpet')).toBe('body');
  });
});

describe('classifyDamageType', () => {
  it('classifies rust notes as rust', () => {
    expect(classifyDamageType('Minor rust on wheel wells')).toBe('rust');
  });

  it('classifies scratch notes as scratch', () => {
    expect(classifyDamageType('Scratch on liftgate (8cm)')).toBe('scratch');
  });

  it('classifies dent notes as dent', () => {
    expect(classifyDamageType('Dent on tailgate')).toBe('dent');
  });

  it('classifies hail damage as hail, not dent, even though hail produces dents', () => {
    expect(classifyDamageType('Hail damage across roof')).toBe('hail');
  });

  it('classifies a windshield chip as chip', () => {
    expect(classifyDamageType('Chip in windshield')).toBe('chip');
  });

  it('classifies a crack note as crack', () => {
    expect(classifyDamageType('Crack in front bumper')).toBe('crack');
  });

  it('falls back to "other" for unrecognised body notes', () => {
    expect(classifyDamageType('Faded paint on hood')).toBe('other');
  });
});

describe('classifyDamageSeverity', () => {
  it('classifies a cracked frame as structural', () => {
    expect(classifyDamageSeverity('Crack in front bumper near headlight')).toBe('structural');
  });

  it('classifies frame damage as structural', () => {
    expect(classifyDamageSeverity('Frame damage, prior collision repair')).toBe('structural');
  });

  it('classifies an airbag note as structural', () => {
    expect(classifyDamageSeverity('Airbag deployed in prior incident')).toBe('structural');
  });

  it('classifies rust as wear', () => {
    expect(classifyDamageSeverity('Minor rust on wheel wells')).toBe('wear');
  });

  it('classifies a dent as wear', () => {
    expect(classifyDamageSeverity('Small dent on driver-side door')).toBe('wear');
  });

  it('classifies hail damage as wear', () => {
    expect(classifyDamageSeverity('Hail damage across roof')).toBe('wear');
  });

  it('classifies a scratch as cosmetic', () => {
    expect(classifyDamageSeverity('Scratch along driver-side fender')).toBe('cosmetic');
  });

  it('classifies paint peeling as cosmetic, not "other"', () => {
    expect(classifyDamageSeverity('Paint peeling on roof rack')).toBe('cosmetic');
  });

  it('classifies a windshield chip as cosmetic', () => {
    expect(classifyDamageSeverity('Chip in windshield (passenger side)')).toBe('cosmetic');
  });

  it('defaults unmatched body notes to cosmetic (never silently upgrades concern)', () => {
    expect(classifyDamageSeverity('Faded clearcoat on trunk lid')).toBe('cosmetic');
  });

  it('prefers structural over wear when both keywords appear (e.g. cracked rust spot)', () => {
    expect(classifyDamageSeverity('Crack in rust patch on rocker panel')).toBe('structural');
  });
});
