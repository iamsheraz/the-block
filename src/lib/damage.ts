// Damage-note classification and body-region mapping for the SVG diagram.
//
// Notes in the dataset are free-text strings. Two questions need answering:
//   1. Is this a body / cosmetic concern, or a mechanical / drivability one?
//   2. If it's body, where on the silhouette does the dot belong?
//
// Both are keyword heuristics. They cover the canonical phrasings in the
// committed dataset cleanly and degrade to "other" for anything ambiguous;
// the diagram renders ambiguous notes at a generic centerline position so
// the count of dots still equals the count of body notes.

export type DamageClassification = 'body' | 'mechanical';

export type DamageType = 'rust' | 'scratch' | 'dent' | 'crack' | 'chip' | 'hail' | 'other';

// Severity is the dimension the buyer triages on: cosmetic (skip), wear (note
// it, factor into bid), structural (stop, click in). Drives the diagram's
// colour + shape language so a glance answers "anything I need to worry about".
export type DamageSeverity = 'cosmetic' | 'wear' | 'structural';

export type RegionKey =
  | 'front'
  | 'hood'
  | 'windshield'
  | 'roof'
  | 'driver-side'
  | 'passenger-side'
  | 'rear-quarter'
  | 'liftgate'
  | 'wheel-fl'
  | 'wheel-fr'
  | 'wheel-rl'
  | 'wheel-rr'
  | 'wheels-rear'
  | 'interior'
  | 'other';

export type DamagePoint = {
  region: RegionKey;
  x: number;
  y: number;
};

// SVG diagram viewBox is 0 0 220 340, body rect ~ x=50 y=22 w=120 h=298.
const REGION_POSITIONS: Record<RegionKey, { x: number; y: number }> = {
  front: { x: 110, y: 40 },
  hood: { x: 110, y: 75 },
  windshield: { x: 110, y: 122 },
  roof: { x: 110, y: 175 },
  'driver-side': { x: 62, y: 175 },
  'passenger-side': { x: 158, y: 175 },
  'rear-quarter': { x: 62, y: 232 },
  liftgate: { x: 110, y: 308 },
  'wheel-fl': { x: 45, y: 80 },
  'wheel-fr': { x: 175, y: 80 },
  'wheel-rl': { x: 45, y: 264 },
  'wheel-rr': { x: 175, y: 264 },
  'wheels-rear': { x: 110, y: 260 },
  interior: { x: 110, y: 188 },
  other: { x: 110, y: 175 },
};

const MECHANICAL_KEYWORDS: readonly string[] = [
  'transmission',
  'compressor',
  'check engine',
  'catalytic',
  'electrical',
  'brake rotor',
  'brake pad',
  'alternator',
  'starter',
  'coolant',
  'engine knock',
  'engine misfire',
  'oil leak',
  'wheel bearing',
];

export function classifyNote(note: string): DamageClassification {
  const lower = note.toLowerCase();
  return MECHANICAL_KEYWORDS.some((k) => lower.includes(k)) ? 'mechanical' : 'body';
}

// Body-damage subtype, used by the diagram to colour each marker and by the
// legend to show what each colour means. Order matters: more specific keywords
// (e.g. "hail" before "dent") win.
const TYPE_RULES: ReadonlyArray<{ keyword: string; type: DamageType }> = [
  { keyword: 'rust', type: 'rust' },
  { keyword: 'corrosion', type: 'rust' },
  { keyword: 'hail', type: 'hail' },
  { keyword: 'crack', type: 'crack' },
  { keyword: 'chip', type: 'chip' },
  { keyword: 'dent', type: 'dent' },
  { keyword: 'ding', type: 'dent' },
  { keyword: 'scratch', type: 'scratch' },
  { keyword: 'scuff', type: 'scratch' },
  { keyword: 'scrape', type: 'scratch' },
];

export function classifyDamageType(note: string): DamageType {
  const lower = note.toLowerCase();
  const match = TYPE_RULES.find((rule) => lower.includes(rule.keyword));
  return match ? match.type : 'other';
}

// Severity rules run top-down; structural keywords sit first so "crack in
// frame" never falls through to a softer band. Unmatched body notes default to
// cosmetic — a dealer can downgrade their attention but shouldn't be lied to
// in the other direction.
const SEVERITY_RULES: ReadonlyArray<{ keyword: string; severity: DamageSeverity }> = [
  { keyword: 'frame damage', severity: 'structural' },
  { keyword: 'frame', severity: 'structural' },
  { keyword: 'crack', severity: 'structural' },
  { keyword: 'collision', severity: 'structural' },
  { keyword: 'structural', severity: 'structural' },
  { keyword: 'panel detached', severity: 'structural' },
  { keyword: 'panel separated', severity: 'structural' },
  { keyword: 'panel missing', severity: 'structural' },
  { keyword: 'airbag', severity: 'structural' },
  { keyword: 'rust', severity: 'wear' },
  { keyword: 'corrosion', severity: 'wear' },
  { keyword: 'hail', severity: 'wear' },
  { keyword: 'dent', severity: 'wear' },
  { keyword: 'ding', severity: 'wear' },
  { keyword: 'tear', severity: 'wear' },
  { keyword: 'scratch', severity: 'cosmetic' },
  { keyword: 'scuff', severity: 'cosmetic' },
  { keyword: 'scrape', severity: 'cosmetic' },
  { keyword: 'chip', severity: 'cosmetic' },
  { keyword: 'peel', severity: 'cosmetic' },
  { keyword: 'fade', severity: 'cosmetic' },
  { keyword: 'paint', severity: 'cosmetic' },
];

export function classifyDamageSeverity(note: string): DamageSeverity {
  const lower = note.toLowerCase();
  const match = SEVERITY_RULES.find((rule) => lower.includes(rule.keyword));
  return match ? match.severity : 'cosmetic';
}

// Sort order for the legend: structural concerns rise to the top so a buyer
// triaging the card sees the worst first. Lower number = higher visual priority.
export const SEVERITY_RANK: Record<DamageSeverity, number> = {
  structural: 0,
  wear: 1,
  cosmetic: 2,
};

type Rule = { match: (lower: string) => boolean; region: RegionKey };

const REGION_RULES: readonly Rule[] = [
  // Specific corners first so they win against the generic "wheel well" fallback.
  { match: (s) => s.includes('driver-rear') && s.includes('wheel'), region: 'wheel-rl' },
  { match: (s) => s.includes('passenger-rear') && s.includes('wheel'), region: 'wheel-rr' },
  { match: (s) => s.includes('front-right') && s.includes('wheel'), region: 'wheel-fr' },
  { match: (s) => s.includes('front-left') && s.includes('wheel'), region: 'wheel-fl' },
  // Rear quarter panel (steel above the rear wheel).
  { match: (s) => s.includes('rear quarter'), region: 'rear-quarter' },
  // Generic wheel-well note with no side specified → split across rear wheels.
  { match: (s) => s.includes('wheel well'), region: 'wheels-rear' },
  // Rear of car: liftgate / tailgate / rear bumper / taillight / mud flap.
  { match: (s) => s.includes('liftgate'), region: 'liftgate' },
  { match: (s) => s.includes('tailgate'), region: 'liftgate' },
  { match: (s) => s.includes('rear bumper'), region: 'liftgate' },
  { match: (s) => s.includes('taillight'), region: 'liftgate' },
  { match: (s) => s.includes('mud flap'), region: 'wheels-rear' },
  // Doors / mirrors.
  {
    match: (s) => s.includes('driver-side door') || s.includes('driver door'),
    region: 'driver-side',
  },
  { match: (s) => s.includes('passenger-side mirror'), region: 'passenger-side' },
  { match: (s) => s.includes('driver-side mirror'), region: 'driver-side' },
  { match: (s) => s.includes('driver-side fender'), region: 'driver-side' },
  { match: (s) => s.includes('sill plate'), region: 'interior' },
  // Front of car.
  { match: (s) => s.includes('front bumper'), region: 'front' },
  { match: (s) => s.includes('grille'), region: 'front' },
  { match: (s) => s.includes('frame damage'), region: 'front' },
  { match: (s) => s.includes('headlight'), region: 'hood' },
  { match: (s) => s.includes('hood'), region: 'hood' },
  // Roof / windshield.
  { match: (s) => s.includes('windshield'), region: 'windshield' },
  { match: (s) => s.includes('roof rack') || s.includes('roof'), region: 'roof' },
  { match: (s) => s.includes('hail'), region: 'roof' },
  // Interior surfaces.
  { match: (s) => s.includes('upholstery'), region: 'interior' },
  { match: (s) => s.includes('seat'), region: 'interior' },
  { match: (s) => s.includes('leather'), region: 'interior' },
  { match: (s) => s.includes('cargo area'), region: 'interior' },
  { match: (s) => s.includes('airbag'), region: 'interior' },
  { match: (s) => s.includes('center cap'), region: 'wheels-rear' },
];

export function mapToRegion(note: string): DamagePoint {
  const lower = note.toLowerCase();
  const match = REGION_RULES.find((rule) => rule.match(lower));
  const region: RegionKey = match ? match.region : 'other';
  const pos = REGION_POSITIONS[region];
  return { region, x: pos.x, y: pos.y };
}
