'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { UserPromise } from '@/lib/types';

export function usePromises() {
  const { user } = useAuth();
  const [promises, setPromises] = useState<UserPromise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'promises'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setPromises(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          deadline: (data.deadline as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp).toDate(),
          milestones: (data.milestones || []).map((m: Record<string, unknown>) => ({
            ...m,
            date: (m.date as Timestamp).toDate(),
          })),
        } as UserPromise;
      }));
      setLoading(false);
    });
  }, [user]);

  async function addPromise(data: Omit<UserPromise, 'id' | 'createdAt' | 'status'>) {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'promises'), {
      ...data,
      deadline: Timestamp.fromDate(data.deadline),
      milestones: data.milestones.map(m => ({ ...m, date: Timestamp.fromDate(m.date) })),
      status: 'active',
      createdAt: Timestamp.now(),
    });
  }

  async function updateStatus(id: string, status: UserPromise['status']) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'promises', id), { status });
  }

  return { promises, loading, addPromise, updateStatus };
}
