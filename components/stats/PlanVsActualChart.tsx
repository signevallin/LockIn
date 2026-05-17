'use client';
import type { WeeklyWeight } from '@/lib/hooks/useWeightHistory';

interface Props {
  weeklyWeights: WeeklyWeight[];
  /** Total kcal deficit (or surplus) for the current week — used as the weekly rate for the plan line */
  weeklyDeficitKcal: number;
}

export function PlanVsActualChart({ weeklyWeights, weeklyDeficitKcal }: Props) {
  if (weeklyWeights.length === 0) {
    return (
      <p className="text-xs text-earth-light text-center py-4">
        Ingen viktdata ännu — synka via Genvägen
      </p>
    );
  }

  const startWeight = weeklyWeights[0].weightKg;
  const kgPerWeek = weeklyDeficitKcal / 7700;

  // Plan extends 2 weeks past the last actual reading
  const futurePlanWeeks = 2;
  const totalPlanPoints = weeklyWeights.length + futurePlanWeeks;
  const planWeights = Array.from({ length: totalPlanPoints }, (_, i) =>
    startWeight - i * kgPerWeek,
  );

  const allWeights = [
    ...planWeights,
    ...weeklyWeights.map(w => w.weightKg),
  ];
  const minW = Math.min(...allWeights) - 0.3;
  const maxW = Math.max(...allWeights) + 0.3;
  const range = maxW - minW || 1;

  const W = 280, H = 80;
  const LEFT_PAD = 18, BOTTOM_PAD = 14, TOP_PAD = 8;
  const chartW = W - LEFT_PAD;
  const chartH = H - BOTTOM_PAD - TOP_PAD;

  const xStep = chartW / (totalPlanPoints - 1);
  const cx = (i: number) => LEFT_PAD + i * xStep;
  const cy = (w: number) => TOP_PAD + chartH - ((w - minW) / range) * chartH;

  const planPts = planWeights.map((w, i) => `${cx(i)},${cy(w)}`).join(' ');
  const actualPts = weeklyWeights.map((w, i) => `${cx(i)},${cy(w.weightKg)}`).join(' ');

  // 4 evenly spaced y-axis labels
  const yTicks = [0, 1, 2, 3].map(i => minW + (range / 3) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
      {/* Grid + y-axis */}
      {yTicks.map((v, i) => {
        const yPos = cy(v);
        return (
          <g key={i}>
            <line x1={LEFT_PAD} y1={yPos} x2={W} y2={yPos} stroke="#c8dbe8" strokeWidth="0.5" />
            <text x={0} y={yPos + 2} fontSize="6" fill="#7a5c54">
              {v.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Plan line (dashed) */}
      <polyline
        points={planPts}
        fill="none"
        stroke="#513229"
        strokeWidth="1.5"
        strokeDasharray="3,2"
      />

      {/* Actual line */}
      <polyline
        points={actualPts}
        fill="none"
        stroke="#c8aa6e"
        strokeWidth="1.5"
      />

      {/* Actual dots */}
      {weeklyWeights.map((w, i) => {
        const isLast = i === weeklyWeights.length - 1;
        return isLast ? (
          <circle
            key={i}
            cx={cx(i)} cy={cy(w.weightKg)}
            r="3.5"
            fill="#513229" stroke="#f0d48e" strokeWidth="1.5"
          />
        ) : (
          <circle
            key={i}
            cx={cx(i)} cy={cy(w.weightKg)}
            r="2.5"
            fill="#f0d48e" stroke="#513229" strokeWidth="1"
          />
        );
      })}

      {/* Week labels for actual readings */}
      {weeklyWeights.map((w, i) => {
        const isLast = i === weeklyWeights.length - 1;
        return (
          <text
            key={i}
            x={cx(i)} y={H}
            fontSize="6"
            fill={isLast ? '#513229' : '#7a5c54'}
            fontWeight={isLast ? 'bold' : 'normal'}
            textAnchor="middle"
          >
            {isLast ? 'nu' : w.weekLabel}
          </text>
        );
      })}

      {/* Future week labels (faded) */}
      {Array.from({ length: futurePlanWeeks }, (_, i) => {
        const idx = weeklyWeights.length + i;
        // Derive future week number from the last known week label
        const lastLabel = weeklyWeights[weeklyWeights.length - 1]?.weekLabel ?? 'v0';
        const lastWeekNum = parseInt(lastLabel.replace('v', ''), 10);
        return (
          <text
            key={`f${i}`}
            x={cx(idx)} y={H}
            fontSize="6"
            fill="#7a5c54"
            opacity="0.35"
            textAnchor="middle"
          >
            v{lastWeekNum + i + 1}
          </text>
        );
      })}
    </svg>
  );
}
