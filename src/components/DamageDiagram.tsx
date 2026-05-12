import { classifyNote, mapToRegion } from '../lib/damage';

type DamageDiagramProps = {
  notes: string[];
};

export function DamageDiagram({ notes }: DamageDiagramProps) {
  const bodyNotes = notes.filter((n) => classifyNote(n) === 'body');
  const seen = new Map<string, number>();
  const markers = bodyNotes.map((note) => {
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

          {/* Damage markers, jittered when a region collides with itself */}
          {markers.map((marker, idx) => {
            const offsetIdx = countSameRegionBefore(markers, idx);
            const jitter = offsetIdx === 0 ? 0 : offsetIdx * 8;
            const cx = marker.point.x + jitter;
            return (
              <g key={marker.key} data-testid="damage-marker">
                <circle
                  cx={cx}
                  cy={marker.point.y}
                  r="6"
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth="2"
                >
                  <title>{marker.note}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function countSameRegionBefore(markers: { point: { region: string } }[], index: number): number {
  const current = markers[index];
  if (!current) return 0;
  const region = current.point.region;
  let count = 0;
  for (let i = 0; i < index; i += 1) {
    if (markers[i]?.point.region === region) count += 1;
  }
  return count;
}
