'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { FoodItem, FoodLogDay } from '@/lib/types';

export type MealKey = keyof FoodLogDay['meals'];

const EMPTY_LOG: FoodLogDay = {
  meals: { frukost: [], lunch: [], middag: [], mellanmal: [] },
};

function toFoodLogDay(data: unknown): FoodLogDay {
  const d = data as Record<string, unknown>;
  const meals = (d.meals ?? {}) as Record<string, unknown[]>;
  return {
    meals: {
      frukost: (meals.frukost ?? []) as FoodItem[],
      lunch: (meals.lunch ?? []) as FoodItem[],
      middag: (meals.middag ?? []) as FoodItem[],
      mellanmal: (meals.mellanmal ?? []) as FoodItem[],
    },
  };
}

function computeTotals(log: FoodLogDay) {
  const items = Object.values(log.meals).flat();
  return {
    kcal: items.reduce((s, i) => s + i.kcal, 0),
    proteinG: items.reduce((s, i) => s + i.proteinG, 0),
    fatG: items.reduce((s, i) => s + i.fatG, 0),
    carbsG: items.reduce((s, i) => s + i.carbsG, 0),
  };
}

export function useFoodLog(date: string) {
  const { user } = useAuth();
  const [log, setLog] = useState<FoodLogDay>(EMPTY_LOG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'food_log', date);
    return onSnapshot(ref, snap => {
      setLog(snap.exists() ? toFoodLogDay(snap.data()) : EMPTY_LOG);
      setLoading(false);
    });
  }, [user, date]);

  async function addItem(meal: MealKey, item: FoodItem) {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'food_log', date);
    const next: FoodLogDay = {
      meals: { ...log.meals, [meal]: [...log.meals[meal], item] },
    };
    await setDoc(ref, next);
  }

  async function removeItem(meal: MealKey, index: number) {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'food_log', date);
    const next: FoodLogDay = {
      meals: {
        ...log.meals,
        [meal]: log.meals[meal].filter((_, i) => i !== index),
      },
    };
    await setDoc(ref, next);
  }

  return { log, loading, addItem, removeItem, totals: computeTotals(log) };
}
