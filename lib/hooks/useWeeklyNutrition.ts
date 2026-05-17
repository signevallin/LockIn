'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { FoodLogDay, FoodItem } from '@/lib/types';

function getPastDates(count: number): string[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

function sumKcal(data: unknown): number {
  const d = data as { meals?: Record<string, FoodItem[]> };
  if (!d.meals) return 0;
  return Object.values(d.meals)
    .flat()
    .reduce((s: number, item: FoodItem) => s + (item.kcal ?? 0), 0);
}

export function useWeeklyNutrition() {
  const { user } = useAuth();
  const [days, setDays] = useState<{ date: string; consumedKcal: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const dates = getPastDates(7);
    Promise.all(
      dates.map(date =>
        getDoc(doc(db, 'users', user.uid, 'food_log', date)).then(snap => ({
          date,
          consumedKcal: snap.exists() ? sumKcal(snap.data()) : 0,
        })),
      ),
    ).then(setDays);
  }, [user]);

  const totalConsumedKcal = days.reduce((s, d) => s + d.consumedKcal, 0);
  return { days, totalConsumedKcal };
}
