'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { HealthData } from '@/lib/types';

function toHealthData(data: Record<string, unknown>): HealthData {
  return {
    steps: (data.steps as number) ?? 0,
    totalCalories: (data.totalCalories as number) ?? 0,
    workoutMinutes: (data.workoutMinutes as number) ?? 0,
    syncedAt: data.syncedAt
      ? (data.syncedAt as Timestamp).toDate()
      : new Date(),
    weight: typeof data.weight === 'number' ? data.weight : undefined,
  };
}

export function useHealthData(date: string) {
  const { user } = useAuth();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'health_data', date);
    return onSnapshot(ref, snap => {
      setData(snap.exists() ? toHealthData(snap.data() as Record<string, unknown>) : null);
      setLoading(false);
    });
  }, [user, date]);

  return { data, loading };
}
