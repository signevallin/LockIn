'use client';
import { useState } from 'react';
import { useFoodLog } from '@/lib/hooks/useFoodLog';
import type { MealKey } from '@/lib/hooks/useFoodLog';
import { useFoodFavorites } from '@/lib/hooks/useFoodFavorites';
import { DailyNutritionChips } from '@/components/kost/DailyNutritionChips';
import { MealSection } from '@/components/kost/MealSection';
import { AddFoodSheet } from '@/components/kost/AddFoodSheet';
import type { FoodItem, FoodFavorite } from '@/lib/types';

const MEALS: { key: MealKey; label: string; emoji: string }[] = [
  { key: 'frukost', label: 'Frukost', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'middag', label: 'Middag', emoji: '🌙' },
  { key: 'mellanmal', label: 'Mellanmål', emoji: '🍎' },
];

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function KostPage() {
  const today = todayDate();
  const { log, totals, addItem, removeItem } = useFoodLog(today);
  const { favorites, saveFavorite } = useFoodFavorites();
  const [addingTo, setAddingTo] = useState<MealKey | null>(null);

  const activeMeal = MEALS.find(m => m.key === addingTo);

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold text-earth pt-2">Kost · idag</h1>

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
          favorites={favorites}
          onAdd={(item: FoodItem) => {
            if (addingTo) addItem(addingTo, item);
          }}
          onSaveFavorite={(fav: Omit<FoodFavorite, 'id' | 'lastUsedAt'>) =>
            saveFavorite(fav)
          }
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  );
}
