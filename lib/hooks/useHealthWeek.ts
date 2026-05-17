'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { HealthData } from '@/lib/types';

function getPastDates(count: number): string[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i)); // oldest first
    return d.toISOString().split('T')[0];
  });
}

function toHealthData(data: Record<string, unknown>): HealthData {
  return {
    steps: (data.steps as number) ?? 0,
    totalCalories: (data.totalCalories as number) ?? 0,
    workoutMinutes: (data.workoutMinutes as number) ?? 0,
    syncedAt: data.syncedAt
      ? (data.syncedAt as Timestamp).toDate()
      : new Date(),
  };
}

export function useHealthWeek() {
  const { user } = useAuth();
  const [days, setDays] = useState<{ date: string; data: HealthData | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    const dates = getPastDates(7);
    Promise.all(
      dates.map(date =>
        getDoc(doc(db, 'users', user.uid, 'health_data', date)).then(snap => ({
          date,
          data: snap.exists()
            ? toHealthData(snap.data() as Record<string, unknown>)
            : null,
        })),
      ),
    ).then(setDays);
  }, [user]);

  return { days };
}
