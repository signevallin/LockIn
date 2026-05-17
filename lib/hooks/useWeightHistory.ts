'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';

export interface WeeklyWeight {
  weekLabel: string;  // e.g. 'v20'
  date: string;       // ISO date of the representative reading
  weightKg: number;
}

function getPastDates(count: number): string[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

/** ISO week number (1-53) for a given Date */
function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function useWeightHistory() {
  const { user } = useAuth();
  const [weeklyWeights, setWeeklyWeights] = useState<WeeklyWeight[]>([]);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [previousWeekWeight, setPreviousWeekWeight] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const dates = getPastDates(70); // ~10 weeks of daily dates

    Promise.all(
      dates.map(date =>
        getDoc(doc(db, 'users', user.uid, 'health_data', date)).then(snap => {
          if (!snap.exists()) return null;
          const data = snap.data() as Record<string, unknown>;
          if (typeof data.weight !== 'number') return null;
          return { date, weightKg: data.weight as number };
        }),
      ),
    ).then(results => {
      const entries = results.filter(
        (e): e is { date: string; weightKg: number } => e !== null,
      );

      // Group by ISO week — keep the latest reading per week
      const byWeek = new Map<number, { date: string; weightKg: number }>();
      for (const e of entries) {
        const week = isoWeek(new Date(e.date + 'T12:00:00'));
        const existing = byWeek.get(week);
        if (!existing || e.date > existing.date) byWeek.set(week, e);
      }

      const sorted: WeeklyWeight[] = Array.from(byWeek.entries())
        .sort(([a], [b]) => a - b)
        .map(([week, e]) => ({
          weekLabel: `v${week}`,
          date: e.date,
          weightKg: e.weightKg,
        }));

      setWeeklyWeights(sorted);
      if (sorted.length >= 1) setLatestWeight(sorted[sorted.length - 1].weightKg);
      if (sorted.length >= 2) setPreviousWeekWeight(sorted[sorted.length - 2].weightKg);
    });
  }, [user]);

  return { weeklyWeights, latestWeight, previousWeekWeight };
}
