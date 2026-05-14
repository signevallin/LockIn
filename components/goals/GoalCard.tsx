'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Goal, SubGoal } from '@/lib/types';

interface Props {
  goal: Goal;
  onProgressUpdate: (goalId: string, subGoals: SubGoal[]) => void;
}

export function GoalCard({ goal, onProgressUpdate }: Props) {
  const { user } = useAuth();
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user || !expanded) return;
    return onSnapshot(
      collection(db, 'users', user.uid, 'goals', goal.id, 'sub_goals'),
      snap => setSubGoals(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title as string,
          completed: data.completed as boolean,
          completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : null,
        } as SubGoal;
      }))
    );
  }, [user, goal.id, expanded]);

  async function toggleSubGoal(subGoal: SubGoal) {
    if (!user) return;
    const nowCompleted = !subGoal.completed;
    const updated = {
      completed: nowCompleted,
      completedAt: nowCompleted ? Timestamp.now() : null,
    };
    await updateDoc(doc(db, 'users', user.uid, 'goals', goal.id, 'sub_goals', subGoal.id), updated);
    const next = subGoals.map(s => s.id === subGoal.id
      ? { ...s, completed: nowCompleted, completedAt: nowCompleted ? new Date() : null }
      : s
    );
    onProgressUpdate(goal.id, next);
  }

  const daysLeft = Math.ceil((goal.deadline.getTime() - Date.now()) / 86400000);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button className="w-full p-4 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between mb-2">
          <p className="font-semibold text-earth text-sm flex-1">{goal.category} {goal.title}</p>
          <span className="text-xs text-earth-light ml-2">{expanded ? '▲' : '▼'}</span>
        </div>
        <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden mb-1">
          <div className="h-full bg-earth rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-earth-light">
          <span>{goal.progress}%</span>
          <span>{daysLeft > 0 ? `${daysLeft} dagar kvar` : 'Passerad deadline'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-cream-dark">
          {subGoals.length === 0 && <p className="text-sm text-earth-light py-3">Inga delmål.</p>}
          {subGoals.map(sg => (
            <button
              key={sg.id}
              onClick={() => toggleSubGoal(sg)}
              className="w-full flex items-center gap-3 py-2.5 text-left border-b border-cream-dark last:border-0"
            >
              <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${sg.completed ? 'bg-earth border-earth' : 'border-sage'}`}>
                {sg.completed && <span className="text-cream text-xs">✓</span>}
              </div>
              <span className={`text-sm ${sg.completed ? 'line-through text-earth-light' : 'text-earth'}`}>{sg.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
