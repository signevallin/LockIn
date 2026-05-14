'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import { todayKey } from '@/lib/utils/dateUtils';
import type { CheckIn } from '@/lib/types';

export function useCheckIn() {
  const { user } = useAuth();
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid, 'check_ins', todayKey())).then(snap => {
      if (snap.exists()) {
        const raw = snap.data();
        setTodayCheckIn({
          ...raw,
          createdAt: (raw.createdAt as Timestamp).toDate(),
        } as CheckIn);
      }
      setLoading(false);
    });
  }, [user]);

  async function checkIn(mood: CheckIn['mood'], reflection: string) {
    if (!user) return;
    const data: CheckIn = {
      date: todayKey(),
      mood,
      reflection,
      createdAt: new Date(),
    };
    await setDoc(doc(db, 'users', user.uid, 'check_ins', todayKey()), {
      ...data,
      createdAt: Timestamp.now(),
    });
    setTodayCheckIn(data);
  }

  return { todayCheckIn, loading, checkIn };
}
