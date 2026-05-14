'use client';

interface DataPoint { label: string; value: number; isToday?: boolean; }

interface Props { data: DataPoint[]; maxValue?: number; }

export function ActivityChart({ data, maxValue }: Props) {
  const rawMax = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;
  const max = maxValue ?? Math.max(rawMax, 1);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-md transition-all ${d.isToday ? 'bg-earth' : 'bg-earth/40'}`}
              style={{ height: `${Math.round((d.value / max) * 100)}%`, minHeight: d.value > 0 ? '4px' : '0' }}
            />
          </div>
        ))}
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
