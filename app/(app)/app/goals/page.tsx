'use client';
import { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGoals } from '@/lib/hooks/useGoals';
import { usePromises } from '@/lib/hooks/usePromises';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalForm } from '@/components/goals/GoalForm';
import { PromiseCard } from '@/components/promises/PromiseCard';
import { PromiseForm } from '@/components/promises/PromiseForm';
import { Button } from '@/components/ui/Button';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import type { Goal } from '@/lib/types';

type Tab = 'goals' | 'promises';
const TABS: { key: Tab; label: string }[] = [
  { key: 'goals', label: '🎯 Mål' },
  { key: 'promises', label: '🔒 Löften' },
];

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, loading: goalsLoading, updateProgress, deleteGoal, addScheduledTask, removeScheduledTask } = useGoals();
  const { promises, loading: promisesLoading, addPromise, updateStatus } = usePromises();
  const [tab, setTab] = useState<Tab>('goals');
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [promiseFormOpen, setPromiseFormOpen] = useState(false);

  const active = promises.filter(p => p.status === 'active');
  const past = promises.filter(p => p.status !== 'active');

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
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-earth">
          {tab === 'goals' ? 'Mina mål' : 'Mina löften'}
        </h1>
        {tab === 'goals' ? (
          <Button size="sm" onClick={() => setGoalFormOpen(true)}>+ Nytt mål</Button>
        ) : (
          <Button size="sm" onClick={() => setPromiseFormOpen(true)}>+ Nytt löfte</Button>
        )}
      </div>

      {/* Tabs */}
      <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />

      {/* Goals tab */}
      {tab === 'goals' && (
        <>
          {goalsLoading && <p className="text-earth-light text-sm">Laddar...</p>}
          {!goalsLoading && goals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-earth-light text-sm mb-4">Inga mål ännu. Sätt ditt första mål!</p>
              <Button onClick={() => setGoalFormOpen(true)}>Skapa mål</Button>
            </div>
          )}
          <div className="space-y-3">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onProgressUpdate={updateProgress}
                onDelete={deleteGoal}
                onAddScheduled={addScheduledTask}
                onRemoveScheduled={removeScheduledTask}
              />
            ))}
          </div>
        </>
      )}

      {/* Promises tab */}
      {tab === 'promises' && (
        <>
          {promisesLoading && <p className="text-earth-light text-sm">Laddar...</p>}
          {!promisesLoading && promises.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔒</p>
              <p className="text-earth-light text-sm mb-4">Inga löften ännu.<br />Lägg till ett och håll dig accountable.</p>
              <Button onClick={() => setPromiseFormOpen(true)}>Skapa löfte</Button>
            </div>
          )}
          {active.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-earth-light">Aktiva</p>
              {active.map(p => <PromiseCard key={p.id} promise={p} onUpdateStatus={updateStatus} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3 mt-2">
              <p className="text-xs uppercase tracking-widest text-earth-light">Avslutade</p>
              {past.map(p => <PromiseCard key={p.id} promise={p} onUpdateStatus={updateStatus} />)}
            </div>
          )}
        </>
      )}

      <GoalForm open={goalFormOpen} onClose={() => setGoalFormOpen(false)} onSubmit={handleAddGoal} />
      <PromiseForm open={promiseFormOpen} onClose={() => setPromiseFormOpen(false)} onSubmit={addPromise} />
    </div>
  );
}
