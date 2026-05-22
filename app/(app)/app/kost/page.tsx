'use client';
import { useState } from 'react';
import { useFoodLog } from '@/lib/hooks/useFoodLog';
import type { MealKey } from '@/lib/hooks/useFoodLog';
import { DailyNutritionChips } from '@/components/kost/DailyNutritionChips';
import { MealSection } from '@/components/kost/MealSection';
import { AddFoodSheet } from '@/components/kost/AddFoodSheet';
import type { FoodItem } from '@/lib/types';

const MEALS: { key: MealKey; label: string; emoji: string }[] = [
  { key: 'frukost', label: 'Frukost', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'middag', label: 'Middag', emoji: '🌙' },
  { key: 'mellanmal', label: 'Mellanmål', emoji: '🍎' },
];

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = addDays(today, -1);
  if (toISODate(date) === toISODate(today)) return 'Idag';
  if (toISODate(date) === toISODate(yesterday)) return 'Igår';
  return date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function KostPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateStr = toISODate(selectedDate);
  const isToday = dateStr === toISODate(new Date());

  const { log, totals, addItem, removeItem } = useFoodLog(dateStr);
  const [addingTo, setAddingTo] = useState<MealKey | null>(null);

  const activeMeal = MEALS.find(m => m.key === addingTo);

  return (
    <div className="p-4 space-y-3">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-earth">Kost</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(d => addDays(d, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cream-dark text-earth text-lg"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-earth min-w-[70px] text-center">
            {formatDateLabel(selectedDate)}
          </span>
          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            disabled={isToday}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cream-dark text-earth text-lg disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      <DailyNutritionChips
        kcal={totals.kcal}
        proteinG={totals.proteinG}
        fatG={totals.fatG}
        carbsG={totals.carbsG}
      />

      {MEALS.map(({ key, label, emoji }) => (
        <MealSection
          key={key}
          title={label}
          emoji={emoji}
          items={log.meals[key]}
          onAdd={() => setAddingTo(key)}
          onRemove={i => removeItem(key, i)}
        />
      ))}

      {activeMeal && (
        <AddFoodSheet
          open={addingTo !== null}
          mealLabel={activeMeal.label}
          onAdd={(item: FoodItem) => {
            if (addingTo) addItem(addingTo, item);
          }}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  );
}
