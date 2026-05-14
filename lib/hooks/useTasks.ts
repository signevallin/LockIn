'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, setDoc,
  doc, query, orderBy, Timestamp, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { Task } from '@/lib/types';

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    });

    // Load today's completions
    getDoc(doc(db, 'users', user.uid, 'task_completions', todayKey())).then(snap => {
      if (snap.exists()) {
        setCompletedToday(new Set(Object.keys(snap.data())));
      }
    });

    return unsub;
  }, [user]);

  async function addTask(data: Omit<Task, 'id' | 'createdAt'>) {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      ...data,
      createdAt: Timestamp.now(),
    });
  }

  async function toggleTask(taskId: string) {
    if (!user) return;
    const isCompleted = completedToday.has(taskId);
    const ref = doc(db, 'users', user.uid, 'task_completions', todayKey());

    if (isCompleted) {
      setCompletedToday(prev => { const s = new Set(prev); s.delete(taskId); return s; });
      await setDoc(ref, { [taskId]: null }, { merge: true });
    } else {
      setCompletedToday(prev => new Set(prev).add(taskId));
      await setDoc(ref, { [taskId]: Timestamp.now() }, { merge: true });
    }
  }

  return { tasks, completedToday, loading, addTask, toggleTask };
}
