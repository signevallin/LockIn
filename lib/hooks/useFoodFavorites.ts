'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { FoodFavorite } from '@/lib/types';

function toFoodFavorite(id: string, data: Record<string, unknown>): FoodFavorite {
  return {
    id,
    name: data.name as string,
    kcalPer100g: data.kcalPer100g as number,
    proteinPer100gG: data.proteinPer100gG as number,
    fatPer100gG: data.fatPer100gG as number,
    carbsPer100gG: data.carbsPer100gG as number,
    lastUsedAt:
      data.lastUsedAt instanceof Timestamp
        ? data.lastUsedAt.toDate()
        : new Date(),
  };
}

export function useFoodFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FoodFavorite[]>([]);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'users', user.uid, 'food_favorites');
    return onSnapshot(ref, snap => {
      const list = snap.docs.map(d =>
        toFoodFavorite(d.id, d.data() as Record<string, unknown>),
      );
      list.sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
      setFavorites(list);
    });
  }, [user]);

  async function saveFavorite(
    fav: Omit<FoodFavorite, 'id' | 'lastUsedAt'>,
  ) {
    if (!user) return;
    const id = fav.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 64);
    await setDoc(doc(db, 'users', user.uid, 'food_favorites', id), {
      ...fav,
      lastUsedAt: Timestamp.now(),
    });
  }

  async function touchFavorite(id: string) {
    if (!user) return;
    await setDoc(
      doc(db, 'users', user.uid, 'food_favorites', id),
      { lastUsedAt: Timestamp.now() },
      { merge: true },
    );
  }

  return { favorites, saveFavorite, touchFavorite };
}
