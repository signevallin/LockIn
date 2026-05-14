'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { Goal, SubGoal } from '@/lib/types';

function toGoal(id: string, data: Record<string, unknown>): Goal {
  return {
    id,
    title: data.title as string,
    category: data.category as string,
    deadline: (data.deadline as Timestamp).toDate(),
    progress: data.progress as number,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'goals'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setGoals(snap.docs.map(d => toGoal(d.id, d.data())));
      setLoading(false);
    });
  }, [user]);

  async function addGoal(data: Omit<Goal, 'id' | 'createdAt' | 'progress'>) {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'goals'), {
      ...data,
      deadline: Timestamp.fromDate(data.deadline),
      progress: 0,
      createdAt: Timestamp.now(),
    });
  }

  async function updateProgress(goalId: string, subGoals: SubGoal[]) {
    if (!user) return;
    const done = subGoals.filter(s => s.completed).length;
    const progress = subGoals.length ? Math.round((done / subGoals.length) * 100) : 0;
    await updateDoc(doc(db, 'users', user.uid, 'goals', goalId), { progress });
  }

  async function deleteGoal(goalId: string) {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'goals', goalId));
  }

  return { goals, loading, addGoal, updateProgress, deleteGoal };
}
