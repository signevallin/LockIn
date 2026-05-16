'use client';
import { useState, useRef } from 'react';
import type { Task, Goal } from '@/lib/types';

const LONG_PRESS_MS = 500;

interface TaskItemProps {
  task: Task;
  done: boolean;
  goalTitle?: string;
  onToggle: () => void;
  onDelete: () => void;
  deleteLabel: string;
}

function TaskItem({ task, done, goalTitle, onToggle, onDelete, deleteLabel }: TaskItemProps) {
  const [deleteMode, setDeleteMode] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

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
    if (didLongPress.current) return;
    if (deleteMode) { setDeleteMode(false); return; }
    onToggle();
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-cream-dark overflow-hidden select-none ${deleteMode ? 'ring-1 ring-red-200' : ''}`}>
      <button
        className="w-full flex items-center gap-3 py-3 px-4 text-left"
        onTouchStart={startPress}
        onTouchEnd={() => { cancelPress(); handleTap(); }}
        onTouchMove={cancelPress}
        onMouseDown={startPress}
        onMouseUp={() => { cancelPress(); handleTap(); }}
        onMouseLeave={cancelPress}
        onContextMenu={e => e.preventDefault()}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${done ? 'bg-earth border-earth animate-[check-ping_0.3s_ease-out]' : 'border-sage'}`}>
          {done && <span className="text-cream text-xs">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium transition-all duration-300 ${done ? 'line-through text-earth-light' : 'text-earth'}`}>{task.title}</p>
          {(goalTitle || task.category) && (
            <p className="text-xs text-earth-light">
              {goalTitle ? `🎯 ${goalTitle}` : task.category}
              {task.isScheduled && <span className="ml-1 text-earth-light/60">· återkommande</span>}
            </p>
          )}
        </div>
      </button>

      {deleteMode && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2.5 flex items-center justify-between">
          <p className="text-xs text-red-500 font-medium">{deleteLabel}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteMode(false)}
              className="text-xs text-earth-light px-2.5 py-1 rounded-lg bg-white border border-sage"
            >
              Avbryt
            </button>
            <button
              onClick={onDelete}
              className="text-xs text-white font-semibold px-2.5 py-1 rounded-lg bg-red-500"
            >
              Ta bort
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  tasks: Task[];
  completedIds: Set<string>;
  goals: Goal[];
  onToggle: (id: string) => void;
  onAdd: () => void;
  onDeleteTask: (taskId: string) => void;
  onRemoveScheduled: (goalId: string, index: number) => Promise<void>;
}

export function DailyTasks({ tasks, completedIds, goals, onToggle, onAdd, onDeleteTask, onRemoveScheduled }: Props) {
  const goalMap = new Map(goals.map(g => [g.id, g]));

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-earth-light mt-2 mb-3">Dagens uppgifter</p>
      <div className="space-y-2 mb-3">
        {tasks.length === 0 && (
          <p className="text-sm text-earth-light py-2">Inga uppgifter ännu.</p>
        )}
        {tasks.map(task => {
          const goal = task.goalId ? goalMap.get(task.goalId) : undefined;

          // Parse scheduled task index from ID: "sched_{goalId}_{index}"
          const schedMatch = task.isScheduled && task.id.match(/^sched_(.+)_(\d+)$/);

          return (
            <TaskItem
              key={task.id}
              task={task}
              done={completedIds.has(task.id)}
              goalTitle={goal?.title}
              onToggle={() => onToggle(task.id)}
              deleteLabel={task.isScheduled ? `Ta bort schemat för "${task.title}"?` : `Ta bort "${task.title}"?`}
              onDelete={() => {
                if (schedMatch) {
                  const goalId = schedMatch[1];
                  const index = parseInt(schedMatch[2], 10);
                  onRemoveScheduled(goalId, index);
                } else {
                  onDeleteTask(task.id);
                }
              }}
            />
          );
        })}
      </div>
      <button
        onClick={onAdd}
        className="w-full bg-earth text-cream py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        + Lägg till uppgift
      </button>
    </div>
  );
}
