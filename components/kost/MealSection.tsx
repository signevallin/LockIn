'use client';
import type { FoodItem } from '@/lib/types';

interface Props {
  title: string;
  emoji: string;
  items: FoodItem[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function MealSection({ title, emoji, items, onAdd, onRemove }: Props) {
  const totalKcal = items.reduce((s, i) => s + i.kcal, 0);

  return (
    <div className="bg-sky rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-earth">
          {emoji} {title}
          {items.length > 0 && ` · ${Math.round(totalKcal)} kcal`}
        </p>
        <button
          onClick={onAdd}
          className="text-xs text-earth-light bg-white border border-cream-dark rounded-lg px-2 py-1"
        >
          + Lägg till
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-earth-light">Inget loggat</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-earth truncate">
                  {item.name} {item.weightG}g
                </p>
                <p className="text-xs text-earth-light">
                  {Math.round(item.kcal)} kcal · P:{Math.round(item.proteinG)}g · F:{Math.round(item.fatG)}g · K:{Math.round(item.carbsG)}g
                </p>
              </div>
              <button
                onClick={() => onRemove(i)}
                aria-label={`Ta bort ${item.name}`}
                className="text-sm text-earth-light flex-shrink-0 leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}