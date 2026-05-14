'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { CheckIn } from '@/lib/types';

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function useCheckIn() {
  const { user } = useAuth();
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid, 'check_ins', todayKey())).then(snap => {
      if (snap.exists()) setTodayCheckIn(snap.data() as CheckIn);
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
