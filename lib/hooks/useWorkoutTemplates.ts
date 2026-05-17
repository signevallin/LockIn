'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { WorkoutTemplate } from '@/lib/types';

function toTemplate(id: string, data: Record<string, unknown>): WorkoutTemplate {
  return {
    id,
    name: data.name as string,
    exerciseIds: (data.exerciseIds as string[]) ?? [],
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export function useWorkoutTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'workoutTemplates'),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, snap => {
      setTemplates(snap.docs.map(d => toTemplate(d.id, d.data())));
      setLoading(false);
    });
  }, [user]);

  async function addTemplate(name: string, exerciseIds: string[]) {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'workoutTemplates'), {
      name,
      exerciseIds,
      createdAt: Timestamp.now(),
    });
  }

  async function updateTemplate(templateId: string, name: string, exerciseIds: string[]) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'workoutTemplates', templateId), {
      name,
      exerciseIds,
    });
  }

  async function deleteTemplate(templateId: string) {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'workoutTemplates', templateId));
  }

  return { templates, loading, addTemplate, updateTemplate, deleteTemplate };
}
