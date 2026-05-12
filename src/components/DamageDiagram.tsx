import {
  type DamagePoint,
  type DamageSeverity,
  SEVERITY_RANK,
  classifyDamageSeverity,
  classifyNote,
  mapToRegion,
} from '../lib/damage';

type DamageDiagramProps = {
  notes: string[];
};

type Marker = {
  note: string;
  point: DamagePoint;
  severity: DamageSeverity;
  key: string;
};

// Body rect is x=50 y=22 w=120 h=298. Clamp marker centers a few pixels inside
// the rect so the largest marker (r=10 pulse) never escapes the silhouette.
const BODY_MIN_X = 58;
const BODY_MAX_X = 162;
const BODY_MIN_Y = 30;
const BODY_MAX_Y = 312;

// Severity-driven palette. The legend pill and the marker share a colour so
// matching dot ↔ row is one saccade. Cosmetic stays hollow + still (no
// urgency); wear pulses amber; structural is red, larger, and carries a
// glyph for users who can't rely on hue.
const SEVERITY_FILL: Record<DamageSeverity, string> = {
  cosmetic: '#94a3b8', // slate-400, used for the hollow ring stroke
  wear: '#f59e0b', // amber-500
  structural: '#ef4444', // red-500
};

const SEVERITY_DOT_CLASS: Record<DamageSeverity, string> = {
  cosmetic: 'border-2 border-slate-400 bg-white',
  wear: 'bg-amber-500',
  structural: 'bg-red-500',
};

const SEVERITY_LABEL: Record<DamageSeverity, string> = {
  cosmetic: 'Cosmetic',
  wear: 'Wear',
  structural: 'Structural',
};

export function DamageDiagram({ notes }: DamageDiagramProps) {
  const bodyNotes = notes.filter((n) => classifyNote(n) === 'body');
  const seen = new Map<string, number>();
  const markers: Marker[] = bodyNotes.map((note) => {
    const count = seen.get(note) ?? 0;
    seen.set(note, count + 1);
    return {
      note,
      point: mapToRegion(note),
      severity: classifyDamageSeverity(note),
      key: `${note}#${count}`,
    };
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

          <text
            x="110"
            y="14"
            textAnchor="middle"
            className="fill-slate-400"
            style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.12em' }}
          >
            FRONT
          </text>

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

          <path d="M 60 100 L 160 100" stroke="#cbd5e1" strokeWidth="1" />
          <path d="M 65 100 L 155 100 L 150 142 L 70 142 Z" fill="#cbd5e1" opacity="0.5" />
          <rect x="70" y="142" width="80" height="70" fill="#e2e8f0" opacity="0.6" />
          <path d="M 70 212 L 150 212 L 155 254 L 65 254 Z" fill="#cbd5e1" opacity="0.5" />
          <path d="M 60 254 L 160 254" stroke="#cbd5e1" strokeWidth="1" />

          <rect x="44" y="98" width="8" height="6" rx="1.5" fill="#94a3b8" />
          <rect x="168" y="98" width="8" height="6" rx="1.5" fill="#94a3b8" />

          <rect x="38" y="62" width="14" height="36" rx="4" fill="#475569" />
          <rect x="168" y="62" width="14" height="36" rx="4" fill="#475569" />
          <rect x="38" y="246" width="14" height="36" rx="4" fill="#475569" />
          <rect x="168" y="246" width="14" height="36" rx="4" fill="#475569" />

          <line
            x1="110"
            y1="148"
            x2="110"
            y2="208"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Markers render in severity order so structural sits on top of any
              overlapping cosmetic dots. */}
          {sortPlacements(placeMarkers(markers)).map((placement) => (
            <DamageMarker key={placement.marker.key} placement={placement} />
          ))}
        </svg>
      </div>

      {markers.length > 0 ? <Legend markers={markers} /> : null}
    </div>
  );
}

function DamageMarker({ placement }: { placement: Placement }) {
  const { marker, cx, cy } = placement;
  const fill = SEVERITY_FILL[marker.severity];

  if (marker.severity === 'cosmetic') {
    return (
      <g data-testid="damage-marker">
        <circle cx={cx} cy={cy} r="6" fill="white" stroke={fill} strokeWidth="2">
          <title>{marker.note}</title>
        </circle>
      </g>
    );
  }

  if (marker.severity === 'wear') {
    return (
      <g data-testid="damage-marker">
        <circle cx={cx} cy={cy} r="8" fill={fill} opacity="0.45" className="damage-pulse" />
        <circle
          cx={cx}
          cy={cy}
          r="6"
          fill={fill}
          stroke="white"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.15))' }}
        >
          <title>{marker.note}</title>
        </circle>
      </g>
    );
  }

  // structural — larger dot, larger pulse, white "!" glyph for non-colour cue.
  return (
    <g data-testid="damage-marker">
      <circle cx={cx} cy={cy} r="10" fill={fill} opacity="0.5" className="damage-pulse" />
      <circle
        cx={cx}
        cy={cy}
        r="7.5"
        fill={fill}
        stroke="white"
        strokeWidth="2"
        style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.2))' }}
      >
        <title>{marker.note}</title>
      </circle>
      <text
        x={cx}
        y={cy + 3}
        textAnchor="middle"
        fill="white"
        style={{ fontSize: 9, fontWeight: 700, pointerEvents: 'none' }}
      >
        !
      </text>
    </g>
  );
}

function Legend({ markers }: { markers: Marker[] }) {
  // Deduplicate by note text, then sort structural → wear → cosmetic so the
  // worst items rise to the top of the legend.
  const dedup = new Map<string, Marker>();
  for (const marker of markers) {
    if (!dedup.has(marker.note)) dedup.set(marker.note, marker);
  }
  const sorted = Array.from(dedup.values()).sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );

  return (
    <ul className="mt-3 space-y-1.5" aria-label="Damage map legend">
      {sorted.map((marker) => (
        <li key={marker.note} className="flex items-start gap-2 text-[12px]">
          <span
            className={`mt-[3px] inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${SEVERITY_DOT_CLASS[marker.severity]}`}
            aria-hidden="true"
          />
          <span className="text-slate-700">
            {marker.note}
            <span className="ml-1.5 text-[10px] uppercase tracking-wider text-slate-400">
              · {SEVERITY_LABEL[marker.severity]}
            </span>
          </span>
        </li>
      ))}
    </ul>
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

// Lower-severity dots render first so structural dots paint on top when they
// share a region. Stable order within the same severity preserves the spiral
// jitter assignment.
function sortPlacements(placements: Placement[]): Placement[] {
  return [...placements].sort(
    (a, b) => SEVERITY_RANK[b.marker.severity] - SEVERITY_RANK[a.marker.severity],
  );
}

function spiralOffset(idx: number): { dx: number; dy: number } {
  if (idx === 0) return { dx: 0, dy: 0 };
  const ring = Math.ceil(idx / 6);
  const slot = (idx - 1) % 6;
  const angle = (slot * Math.PI) / 3;
  const radius = ring * 9;
  return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
