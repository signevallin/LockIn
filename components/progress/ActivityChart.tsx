'use client';

interface DataPoint { label: string; value: number; isToday?: boolean; }

interface Props { data: DataPoint[]; maxValue?: number; }

export function ActivityChart({ data, maxValue }: Props) {
  const rawMax = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;
  const max = maxValue ?? Math.max(rawMax, 1);

  const fmt = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1).replace('.0', '')}k` : String(v);

  return (
    <div>
      <div className="relative flex items-end gap-1.5 h-24">
        {/* Goal line */}
        {maxValue && (
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-earth/25 pointer-events-none" />
        )}
        {data.map((d) => {
          const pct = Math.round((d.value / max) * 100);
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full">
              {/* Value label above bar */}
              {d.value > 0 && (
                <span className={`text-[9px] mb-0.5 leading-none ${d.isToday ? 'text-earth font-semibold' : 'text-earth-light'}`}>
                  {fmt(d.value)}
                </span>
              )}
              <div
                className={`w-full rounded-t-md transition-all ${d.isToday ? 'bg-earth' : 'bg-earth/40'}`}
                style={{ height: `${pct}%`, minHeight: d.value > 0 ? '4px' : '0' }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {data.map((d) => (
          <div key={d.label} className={`flex-1 text-center text-xs ${d.isToday ? 'text-earth font-bold' : 'text-earth-light'}`}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
