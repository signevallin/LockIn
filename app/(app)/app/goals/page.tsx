'use client';
import { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGoals } from '@/lib/hooks/useGoals';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalForm } from '@/components/goals/GoalForm';
import { Button } from '@/components/ui/Button';
import type { Goal } from '@/lib/types';

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, loading, updateProgress } = useGoals();
  const [formOpen, setFormOpen] = useState(false);

  async function handleAddGoal(data: Omit<Goal, 'id' | 'createdAt' | 'progress'>, subGoalTitles: string[]) {
    if (!user) return;
    const goalRef = await addDoc(collection(db, 'users', user.uid, 'goals'), {
      ...data,
      deadline: Timestamp.fromDate(data.deadline),
      progress: 0,
      createdAt: Timestamp.now(),
    });
    await Promise.all(
      subGoalTitles.map(title =>
        addDoc(collection(db, 'users', user.uid, 'goals', goalRef.id, 'sub_goals'), {
          title,
          completed: false,
          completedAt: null,
        })
      )
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-earth">Mina mål</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>+ Nytt mål</Button>
      </div>

      {loading && <p className="text-earth-light text-sm">Laddar...</p>}
      {!loading && goals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-earth-light text-sm mb-4">Inga mål ännu. Sätt ditt första mål!</p>
          <Button onClick={() => setFormOpen(true)}>Skapa mål</Button>
        </div>
      )}

      <div className="space-y-3">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} onProgressUpdate={updateProgress} />
        ))}
      </div>

      <GoalForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAddGoal} />
    </div>
  );
}
