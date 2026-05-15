'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTasks } from '@/lib/hooks/useTasks';
import { useGoals } from '@/lib/hooks/useGoals';
import { useCheckIn } from '@/lib/hooks/useCheckIn';
import { calculateStreak } from '@/lib/utils/streak';
import { calculateXp } from '@/lib/utils/xp';
import { getDailyQuote } from '@/lib/utils/quotes';
import { ProgressSummary } from '@/components/home/ProgressSummary';
import { DailyTasks } from '@/components/home/DailyTasks';
import { CheckInModal } from '@/components/home/CheckInModal';
import { CoachCard } from '@/components/home/CoachCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { user } = useAuth();
  const { goals, removeScheduledTask } = useGoals();
  const { tasks, completedToday, addTask, toggleTask, deleteTask } = useTasks(goals);
  const { todayCheckIn, loading: checkInLoading, checkIn } = useCheckIn();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: '', goalId: null as string | null });
  const [addingTask, setAddingTask] = useState(false);

  // TODO: pass real task_completion date history for accurate streak
  const streak = calculateStreak([]);
  const totalXp = calculateXp(completedToday.size);
  const name = user?.displayName || user?.email?.split('@')[0] || 'du';

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-earth">Hej, {name} 👋</h1>
          <p className="text-sm text-earth-light">Låt&apos;s lock in idag.</p>
        </div>
        {!checkInLoading && !todayCheckIn ? (
          <button
            onClick={() => setCheckInOpen(true)}
            className="text-sm bg-bay text-earth px-3 py-1.5 rounded-full font-medium"
          >
            Checka in →
          </button>
        ) : todayCheckIn ? (
          <span className="text-sm text-earth-light">
            {['😔','😕','😐','🙂','😄'][todayCheckIn.mood - 1]} Incheckad
          </span>
        ) : null}
      </div>

      {/* Dagligt citat */}
      <div className="bg-earth rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-cream/60 mb-2">Dagens citat</p>
        <p className="text-cream text-sm leading-relaxed italic">&quot;{getDailyQuote()}&quot;</p>
      </div>

      {/* Progress */}
      <ProgressSummary
        completedCount={completedToday.size}
        totalCount={tasks.length}
        streak={streak}
        totalXp={totalXp}
      />

      {/* AI Coach */}
      <CoachCard />

      {/* Tasks */}
      <DailyTasks
        tasks={tasks}
        completedIds={completedToday}
        goals={goals}
        onToggle={toggleTask}
        onAdd={() => setAddTaskOpen(true)}
        onDeleteTask={deleteTask}
        onRemoveScheduled={removeScheduledTask}
      />

      {/* Modaler */}
      <CheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSubmit={checkIn}
      />

      <Modal
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        title="Ny uppgift"
        footer={
          <Button size="lg" disabled={addingTask} onClick={async () => {
            if (!newTask.title || addingTask) return;
            setAddingTask(true);
            try {
              await addTask({ title: newTask.title, category: newTask.category, goalId: newTask.goalId });
              setNewTask({ title: '', category: '', goalId: null });
              setAddTaskOpen(false);
            } finally {
              setAddingTask(false);
            }
          }}>
            {addingTask ? 'Lägger till...' : 'Lägg till'}
          </Button>
        }
      >
        <input
          placeholder="Vad ska du göra?"
          value={newTask.title}
          onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm mb-3 focus:outline-none focus:border-earth"
        />
        <input
          placeholder="Kategori (t.ex. Hälsa)"
          value={newTask.category}
          onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm mb-3 focus:outline-none focus:border-earth"
        />
        {goals.length > 0 && (
          <select
            value={newTask.goalId ?? ''}
            onChange={e => setNewTask(p => ({ ...p, goalId: e.target.value || null }))}
            className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth bg-white"
          >
            <option value="">Inget mål (valfritt)</option>
            {goals.map(g => (
              <option key={g.id} value={g.id}>{g.category} {g.title}</option>
            ))}
          </select>
        )}
      </Modal>
    </div>
  );
}
