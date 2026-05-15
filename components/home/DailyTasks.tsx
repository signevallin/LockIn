import { Button } from '@/components/ui/Button';
import type { Task, Goal } from '@/lib/types';

interface Props {
  tasks: Task[];
  completedIds: Set<string>;
  goals: Goal[];
  onToggle: (id: string) => void;
  onAdd: () => void;
}

export function DailyTasks({ tasks, completedIds, goals, onToggle, onAdd }: Props) {
  const goalMap = new Map(goals.map(g => [g.id, g]));
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-earth-light mb-3">Dagens uppgifter</p>
      <div className="space-y-2 mb-3">
        {tasks.length === 0 && (
          <p className="text-sm text-earth-light py-2">Inga uppgifter ännu.</p>
        )}
        {tasks.map(task => {
          const done = completedIds.has(task.id);
          return (
            <button
              key={task.id}
              onClick={() => onToggle(task.id)}
              className="w-full flex items-center gap-3 py-3 px-4 bg-white rounded-xl shadow-sm text-left"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${done ? 'bg-earth border-earth' : 'border-sage'}`}>
                {done && <span className="text-cream text-xs">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? 'line-through text-earth-light' : 'text-earth'}`}>{task.title}</p>
                <p className="text-xs text-earth-light">
                  {task.goalId && goalMap.get(task.goalId)
                    ? `🎯 ${goalMap.get(task.goalId)!.title}`
                    : task.category}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <Button variant="outline" size="lg" onClick={onAdd}>+ Lägg till uppgift</Button>
    </div>
  );
}
