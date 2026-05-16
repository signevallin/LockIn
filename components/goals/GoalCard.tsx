'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import type { Goal, SubGoal, ScheduledTask } from '@/lib/types';

const DAYS = [
  { label: 'Mån', day: 1 },
  { label: 'Tis', day: 2 },
  { label: 'Ons', day: 3 },
  { label: 'Tor', day: 4 },
  { label: 'Fre', day: 5 },
  { label: 'Lör', day: 6 },
  { label: 'Sön', day: 0 },
];

const LONG_PRESS_MS = 500;

interface Props {
  goal: Goal;
  onProgressUpdate: (goalId: string, subGoals: SubGoal[]) => void;
  onDelete: (goalId: string) => void;
  onAddScheduled: (goalId: string, task: ScheduledTask) => Promise<void>;
  onRemoveScheduled: (goalId: string, index: number) => Promise<void>;
}

export function GoalCard({ goal, onProgressUpdate, onDelete, onAddScheduled, onRemoveScheduled }: Props) {
  const { user } = useAuth();
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  const [schedTitle, setSchedTitle] = useState('');
  const [schedDays, setSchedDays] = useState<number[]>([]);
  const [addingSched, setAddingSched] = useState(false);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

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

  function startPress() {
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setDeleteMode(true);
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  function handleTap() {
    if (didLongPress.current) return; // long press already handled
    if (deleteMode) { setDeleteMode(false); return; }
    setExpanded(e => !e);
  }

  async function toggleSubGoal(subGoal: SubGoal) {
    if (!user) return;
    const nowCompleted = !subGoal.completed;
    const next = subGoals.map(s => s.id === subGoal.id
      ? { ...s, completed: nowCompleted, completedAt: nowCompleted ? new Date() : null }
      : s
    );
    setSubGoals(next);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'goals', goal.id, 'sub_goals', subGoal.id), {
        completed: nowCompleted,
        completedAt: nowCompleted ? Timestamp.now() : null,
      });
      onProgressUpdate(goal.id, next);
    } catch {
      setSubGoals(subGoals);
    }
  }

  async function handleAddScheduled() {
    if (!schedTitle.trim() || schedDays.length === 0 || addingSched) return;
    setAddingSched(true);
    try {
      await onAddScheduled(goal.id, { title: schedTitle.trim(), weekdays: schedDays });
      setSchedTitle('');
      setSchedDays([]);
    } finally {
      setAddingSched(false);
    }
  }

  function toggleDay(day: number) {
    setSchedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  const daysLeft = Math.ceil((goal.deadline.getTime() - Date.now()) / 86400000);
  const scheduled = goal.scheduledTasks ?? [];

  return (
    <div className="bg-sky rounded-2xl shadow-sm border border-cream-dark overflow-hidden select-none">
      {/* Header — long-pressable */}
      <button
        className="w-full p-4 text-left"
        onTouchStart={startPress}
        onTouchEnd={() => { cancelPress(); handleTap(); }}
        onTouchMove={cancelPress}
        onMouseDown={startPress}
        onMouseUp={() => { cancelPress(); handleTap(); }}
        onMouseLeave={cancelPress}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="font-semibold text-earth text-sm flex-1">{goal.category} {goal.title}</p>
          <span className="text-xs text-earth-light ml-2">
            {deleteMode ? '🗑' : expanded ? '▲' : '▼'}
          </span>
        </div>
        <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden mb-1">
          <div className="h-full bg-earth rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-earth-light">
          <span>{goal.progress}%</span>
          <span>{daysLeft > 0 ? `${daysLeft} dagar kvar` : 'Passerad deadline'}</span>
        </div>
      </button>

      {/* Delete confirmation bar — appears after long press */}
      {deleteMode && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-600 font-medium">Ta bort &quot;{goal.title}&quot;?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteMode(false)}
              className="text-xs text-earth-light px-3 py-1.5 rounded-lg bg-white border border-sage"
            >
              Avbryt
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="text-xs text-white font-semibold px-3 py-1.5 rounded-lg bg-red-500"
            >
              Ta bort
            </button>
          </div>
        </div>
      )}

      {/* Expanded content */}
      {expanded && !deleteMode && (
        <div className="border-t border-cream-dark">
          {/* Sub-goals */}
          <div className="px-4 pb-2">
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

          {/* Scheduled tasks */}
          <div className="px-4 pb-4 border-t border-cream-dark pt-3">
            <p className="text-xs uppercase tracking-widest text-earth-light mb-2">Schemalagda uppgifter</p>
            {scheduled.length === 0 && (
              <p className="text-xs text-earth-light mb-3">Inga schemalagda uppgifter.</p>
            )}
            {scheduled.map((st, i) => {
              const dayLabels = DAYS.filter(d => st.weekdays.includes(d.day)).map(d => d.label).join(', ');
              return (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-cream-dark last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-earth">{st.title}</p>
                    <p className="text-xs text-earth-light">{dayLabels}</p>
                  </div>
                  <button
                    onClick={() => onRemoveScheduled(goal.id, i)}
                    className="text-earth-light text-xs flex-shrink-0 px-1"
                    aria-label="Ta bort"
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            <div className="mt-3 space-y-2">
              <input
                placeholder="Uppgift (t.ex. Träna)"
                value={schedTitle}
                onChange={e => setSchedTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
              />
              <div className="flex gap-1 flex-wrap">
                {DAYS.map(({ label, day }) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      schedDays.includes(day) ? 'bg-earth text-cream' : 'bg-cream-dark text-earth-light'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddScheduled}
                disabled={!schedTitle.trim() || schedDays.length === 0 || addingSched}
              >
                {addingSched ? 'Sparar...' : '+ Lägg till'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
