import { type DamagePoint, classifyNote, mapToRegion } from '../lib/damage';

type DamageDiagramProps = {
  notes: string[];
};

type Marker = { note: string; point: DamagePoint; key: string };

// Body rect is x=50 y=22 w=120 h=298. Clamp marker centers a few pixels inside
// the rect so an 8-radius dot never escapes the silhouette.
const BODY_MIN_X = 56;
const BODY_MAX_X = 164;
const BODY_MIN_Y = 28;
const BODY_MAX_Y = 314;

export function DamageDiagram({ notes }: DamageDiagramProps) {
  const bodyNotes = notes.filter((n) => classifyNote(n) === 'body');
  const seen = new Map<string, number>();
  const markers: Marker[] = bodyNotes.map((note) => {
    const count = seen.get(note) ?? 0;
    seen.set(note, count + 1);
    return { note, point: mapToRegion(note), key: `${note}#${count}` };
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          Damage map
        </p>
        <span className="text-[10px] text-slate-500 tabular-nums">
          {markers.length === 0 ? 'No body damage reported' : `${markers.length} marked`}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-center">
        <svg
          viewBox="0 0 220 340"
          className="h-64 w-auto"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Top-down body diagram with damage markers"
        >
          <title>Damage map</title>
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* FRONT indicator */}
          <text
            x="110"
            y="14"
            textAnchor="middle"
            className="fill-slate-400"
            style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.12em' }}
          >
            FRONT
          </text>

          {/* Body outline */}
          <rect
            x="50"
            y="22"
            width="120"
            height="298"
            rx="42"
            fill="url(#bodyGrad)"
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          {/* Hood / windshield divider + windshield panel */}
          <path d="M 60 100 L 160 100" stroke="#cbd5e1" strokeWidth="1" />
          <path d="M 65 100 L 155 100 L 150 142 L 70 142 Z" fill="#cbd5e1" opacity="0.5" />
          <rect x="70" y="142" width="80" height="70" fill="#e2e8f0" opacity="0.6" />
          <path d="M 70 212 L 150 212 L 155 254 L 65 254 Z" fill="#cbd5e1" opacity="0.5" />
          <path d="M 60 254 L 160 254" stroke="#cbd5e1" strokeWidth="1" />

          {/* Side mirrors */}
          <rect x="44" y="98" width="8" height="6" rx="1.5" fill="#94a3b8" />
          <rect x="168" y="98" width="8" height="6" rx="1.5" fill="#94a3b8" />

          {/* Wheels */}
          <rect x="38" y="62" width="14" height="36" rx="4" fill="#475569" />
          <rect x="168" y="62" width="14" height="36" rx="4" fill="#475569" />
          <rect x="38" y="246" width="14" height="36" rx="4" fill="#475569" />
          <rect x="168" y="246" width="14" height="36" rx="4" fill="#475569" />

          {/* Centerline */}
          <line
            x1="110"
            y1="148"
            x2="110"
            y2="208"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Damage markers, jittered when several notes share a region. */}
          {placeMarkers(markers).map((placement) => (
            <g key={placement.marker.key} data-testid="damage-marker">
              <circle
                cx={placement.cx}
                cy={placement.cy}
                r="6"
                fill="#f59e0b"
                stroke="white"
                strokeWidth="2"
              >
                <title>{placement.marker.note}</title>
              </circle>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

type Placement = { marker: Marker; cx: number; cy: number };

// Spread same-region markers along a small spiral around the region anchor,
// clamped to stay inside the body silhouette so no dot escapes the rect.
function placeMarkers(markers: Marker[]): Placement[] {
  const counts = new Map<string, number>();
  return markers.map((marker) => {
    const seenSoFar = counts.get(marker.point.region) ?? 0;
    counts.set(marker.point.region, seenSoFar + 1);
    const { dx, dy } = spiralOffset(seenSoFar);
    const cx = clamp(marker.point.x + dx, BODY_MIN_X, BODY_MAX_X);
    const cy = clamp(marker.point.y + dy, BODY_MIN_Y, BODY_MAX_Y);
    return { marker, cx, cy };
  });
}

function spiralOffset(idx: number): { dx: number; dy: number } {
  if (idx === 0) return { dx: 0, dy: 0 };
  // Ring index grows every 6 markers; angle steps around 60° each.
  const ring = Math.ceil(idx / 6);
  const slot = (idx - 1) % 6;
  const angle = (slot * Math.PI) / 3;
  const radius = ring * 9;
  return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
