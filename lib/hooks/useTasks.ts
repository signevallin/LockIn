'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, setDoc, deleteField,
  doc, query, orderBy, Timestamp, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import { todayKey } from '@/lib/utils/dateUtils';
import type { Task, Goal } from '@/lib/types';

export function useTasks(goals: Goal[] = []) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp).toDate() } as Task;
      }));
      setLoading(false);
    });

    getDoc(doc(db, 'users', user.uid, 'task_completions', todayKey())).then(snap => {
      if (!active) return;
      if (snap.exists()) {
        const data = snap.data();
        setCompletedToday(new Set(Object.keys(data).filter(k => data[k] !== null)));
      }
    });

    return () => { active = false; unsub(); };
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
      await setDoc(ref, { [taskId]: deleteField() }, { merge: true });
    } else {
      setCompletedToday(prev => new Set(prev).add(taskId));
      await setDoc(ref, { [taskId]: Timestamp.now() }, { merge: true });
    }
  }

  const todayDay = new Date().getDay();
  const scheduledVirtual: Task[] = goals.flatMap(goal =>
    (goal.scheduledTasks ?? [])
      .map((st, i) => ({ st, i }))
      .filter(({ st }) => st.weekdays.includes(todayDay))
      .map(({ st, i }) => ({
        id: `sched_${goal.id}_${i}`,
        title: st.title,
        category: goal.category,
        goalId: goal.id,
        createdAt: goal.createdAt,
        isScheduled: true,
      }))
  );

  return { tasks: [...scheduledVirtual, ...tasks], completedToday, loading, addTask, toggleTask };
}
