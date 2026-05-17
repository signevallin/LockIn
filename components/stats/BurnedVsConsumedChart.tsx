'use client';

export interface DayPoint {
  label: string;
  burnedKcal: number;
  consumedKcal: number;
  isToday: boolean;
}

interface Props {
  days: DayPoint[];
}

export function BurnedVsConsumedChart({ days }: Props) {
  if (days.length === 0) return null;

  const allValues = days.flatMap(d => [d.burnedKcal, d.consumedKcal]).filter(v => v > 0);
  const rawMax = allValues.length > 0 ? Math.max(...allValues) : 3000;
  // Round up to nearest 500 for clean axis labels
  const maxVal = Math.ceil(rawMax / 500) * 500 || 3000;

  const W = 260, H = 72;
  const LEFT_PAD = 32, BOTTOM_PAD = 14, TOP_PAD = 10;
  const chartW = W - LEFT_PAD;
  const chartH = H - BOTTOM_PAD - TOP_PAD;

  const n = days.length;
  const xStep = n > 1 ? chartW / (n - 1) : 0;
  const cx = (i: number) => LEFT_PAD + i * xStep;
  const cy = (val: number) =>
    TOP_PAD + chartH - Math.max(0, Math.min(val / maxVal, 1)) * chartH;

  const burnedPts = days.map((d, i) => `${cx(i)},${cy(d.burnedKcal)}`).join(' ');
  const consumedPts = days.map((d, i) => `${cx(i)},${cy(d.consumedKcal)}`).join(' ');

  // Three y-axis labels: 1/4, 1/2, 3/4 of max
  const yTicks = [0.25, 0.5, 0.75].map(f => Math.round(maxVal * f));

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px bg-earth" />
          <span className="text-xs text-earth-light">Förbrukat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px" style={{ background: '#c8aa6e' }} />
          <span className="text-xs text-earth-light">Intaget</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
        {/* Y-axis grid + labels */}
        {yTicks.map((tick, i) => {
          const yPos = cy(tick);
          return (
            <g key={i}>
              <line x1={LEFT_PAD} y1={yPos} x2={W} y2={yPos} stroke="#c8dbe8" strokeWidth="0.5" />
              <text x={LEFT_PAD - 3} y={yPos + 2} fontSize="5.5" fill="#7a5c54" textAnchor="end">
                {tick >= 1000 ? `${Math.round(tick / 100) / 10}k` : tick}
              </text>
            </g>
          );
        })}

        {/* Burned line */}
        <polyline points={burnedPts} fill="none" stroke="#513229" strokeWidth="1.5" strokeLinejoin="round" />
        {days.map((d, i) => (
          <circle
            key={`b${i}`}
            cx={cx(i)} cy={cy(d.burnedKcal)} r="2"
            fill="#513229"
            opacity={d.isToday ? 0.45 : 1}
          />
        ))}

        {/* Consumed line */}
        <polyline points={consumedPts} fill="none" stroke="#c8aa6e" strokeWidth="1.5" strokeLinejoin="round" />
        {days.map((d, i) => (
          <circle
            key={`c${i}`}
            cx={cx(i)} cy={cy(d.consumedKcal)} r="2"
            fill="#f0d48e" stroke="#c8aa6e" strokeWidth="1"
            opacity={d.isToday ? 0.45 : 1}
          />
        ))}

        {/* X-axis day labels */}
        {days.map((d, i) => (
          <text
            key={`l${i}`}
            x={cx(i)} y={H}
            fontSize="6"
            fill={d.isToday ? '#513229' : '#7a5c54'}
            fontWeight={d.isToday ? 'bold' : 'normal'}
            textAnchor="middle"
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
