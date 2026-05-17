'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, query, orderBy, limit, getDocs, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { WorkoutSession, SessionExercise, WorkoutSet } from '@/lib/types';

function toSession(id: string, data: Record<string, unknown>): WorkoutSession {
  return {
    id,
    templateId: data.templateId as string,
    templateName: data.templateName as string,
    date: data.date as string,
    exercises: (data.exercises as SessionExercise[]) ?? [],
    completedAt: (data.completedAt as Timestamp).toDate(),
  };
}

export function useWorkoutSessions() {
  const { user } = useAuth();
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'workoutSessions'),
      orderBy('completedAt', 'desc'),
      limit(20),
    );
    getDocs(q).then(snap => {
      setRecentSessions(snap.docs.map(d => toSession(d.id, d.data())));
    });
  }, [user]);

  // Returns the last set logged for exerciseId across the 20 most recent sessions.
  const getLastSet = useCallback((exerciseId: string): WorkoutSet | null => {
    for (const session of recentSessions) {
      const ex = session.exercises.find(e => e.exerciseId === exerciseId);
      if (ex && ex.sets.length > 0) {
        return ex.sets[ex.sets.length - 1];
      }
    }
    return null;
  }, [recentSessions]);

  async function saveSession(
    templateId: string,
    templateName: string,
    exercises: SessionExercise[],
  ) {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, 'users', user.uid, 'workoutSessions'), {
      templateId,
      templateName,
      date: today,
      exercises,
      completedAt: Timestamp.now(),
    });
  }

  return { recentSessions, getLastSet, saveSession };
}
