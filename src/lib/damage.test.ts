import { describe, expect, it } from 'vitest';
import { classifyNote, mapToRegion } from './damage';

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
