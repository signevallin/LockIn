'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc,
  query, where, Timestamp, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { FocusSession } from '@/lib/types';

export function useFocusSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'users', user.uid, 'focus_sessions'),
      where('completedAt', '>=', Timestamp.fromDate(todayStart)),
      orderBy('completedAt', 'desc')
    );
    return onSnapshot(q, snap => {
      const s = snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, completedAt: (data.completedAt as Timestamp).toDate() } as FocusSession;
      });
      setSessions(s);
      setTodayMinutes(s.reduce((sum, sess) => sum + sess.durationMinutes, 0));
      setLoading(false);
    });
  }, [user]);

  async function logSession(mode: FocusSession['mode'], durationMinutes: number) {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'focus_sessions'), {
      mode,
      durationMinutes,
      completedAt: Timestamp.now(),
    });
  }

  return { sessions, todayMinutes, loading, logSession };
}
