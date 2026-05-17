'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { HealthGoals } from '@/lib/types';

export function useHealthGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<HealthGoals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'health_goals', 'goals');
    return onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setGoals({
          dailySteps: (data.dailySteps as number) ?? 10000,
          dailyCalories: (data.dailyCalories as number) ?? 2500,
          healthSyncToken: data.healthSyncToken as string | undefined,
        });
      } else {
        setGoals(null);
      }
      setLoading(false);
    });
  }, [user]);

  async function saveGoals(dailySteps: number, dailyCalories: number) {
    if (!user) return;
    await setDoc(
      doc(db, 'users', user.uid, 'health_goals', 'goals'),
      { dailySteps, dailyCalories },
      { merge: true },
    );
  }

  async function generateToken(): Promise<string | null> {
    if (!user) return null;
    const idToken = await user.getIdToken();
    const res = await fetch('/api/health/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) throw new Error('Failed to generate token');
    const { token } = await res.json() as { token: string };
    return token;
  }

  return { goals, loading, saveGoals, generateToken };
}
