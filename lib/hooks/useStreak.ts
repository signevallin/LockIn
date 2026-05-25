'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import { calculateStreak } from '@/lib/utils/streak';

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;

    getDocs(collection(db, 'users', user.uid, 'task_completions')).then(snap => {
      if (!active) return;
      // Each doc id is a date string (e.g. "2025-05-24").
      // Only count dates where the doc has at least one completed task.
      const dates = snap.docs
        .filter(d => Object.keys(d.data()).length > 0)
        .map(d => d.id);
      setStreak(calculateStreak(dates));
    });

    return () => { active = false; };
  }, [user]);

  return streak;
}
