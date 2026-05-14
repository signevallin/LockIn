'use client';
import { useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGoals } from '@/lib/hooks/useGoals';
import { usePromises } from '@/lib/hooks/usePromises';
import { useCheckIn } from '@/lib/hooks/useCheckIn';
import { ChatInterface } from '@/components/coach/ChatInterface';
import type { CoachContext } from '@/lib/types';

export default function CoachPage() {
  const { user } = useAuth();
  const { goals } = useGoals();
  const { promises } = usePromises();
  const { todayCheckIn } = useCheckIn();

  const context: CoachContext = useMemo(() => ({
    streak: 0, // TODO: wire up streak calculation
    totalXp: 0,
    goals: goals.map(g => ({ title: g.title, progress: g.progress, deadline: g.deadline })),
    promises: promises
      .filter(p => p.status === 'active')
      .map(p => ({
        title: p.title,
        stakeAmount: p.stakeAmount,
        charityOrg: p.charityOrg,
        daysLeft: Math.ceil((p.deadline.getTime() - Date.now()) / 86400000),
      })),
    lastCheckIn: todayCheckIn ? { mood: todayCheckIn.mood, reflection: todayCheckIn.reflection } : null,
  }), [goals, promises, todayCheckIn]);

  async function getIdToken() {
    return (await user?.getIdToken()) ?? '';
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <h1 className="text-xl font-bold text-earth pt-2 mb-4">AI-coach</h1>
      <ChatInterface context={context} getIdToken={getIdToken} />
    </div>
  );
}
