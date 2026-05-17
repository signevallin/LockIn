'use client';
import { useState, useRef } from 'react';
import { getExerciseById } from '@/lib/gym/exercises';
import type { WorkoutTemplate } from '@/lib/types';

const LONG_PRESS_MS = 500;

interface Props {
  templates: WorkoutTemplate[];
  loading: boolean;
  onStart: (template: WorkoutTemplate) => void;
  onEdit: (template: WorkoutTemplate) => void;
  onDelete: (templateId: string) => void;
  onNew: () => void;
}

export function WorkoutTemplateList({ templates, loading, onStart, onEdit, onDelete, onNew }: Props) {
  const [actionId, setActionId] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  function startPress(templateId: string) {
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setActionId(templateId);
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  function handleTap(template: WorkoutTemplate) {
    if (didLongPress.current) return;
    if (actionId) { setActionId(null); return; }
    onStart(template);
  }

  function previewNames(exerciseIds: string[]): string {
    if (exerciseIds.length === 0) return 'Inga övningar — lägg till för att starta';
    const names = exerciseIds.slice(0, 3).map(id => getExerciseById(id)?.name ?? 'Övning');
    const extra = exerciseIds.length > 3 ? ` +${exerciseIds.length - 3} fler` : '';
    return names.join(' · ') + extra;
  }

  if (loading) return <p className="text-earth-light text-sm">Laddar...</p>;

  if (templates.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🏋️</p>
        <p className="text-earth-light text-sm mb-5">Skapa ditt första träningspass!</p>
        <button
          onClick={onNew}
          className="text-sm bg-earth text-cream px-5 py-2.5 rounded-full font-semibold"
        >
          + Ny mall
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map(template => (
        <div key={template.id} className="bg-sky rounded-2xl overflow-hidden select-none">
          <button
            className="w-full p-4 text-left"
            onTouchStart={() => startPress(template.id)}
            onTouchEnd={() => { cancelPress(); handleTap(template); }}
            onTouchMove={cancelPress}
            onMouseDown={() => startPress(template.id)}
            onMouseUp={() => { cancelPress(); handleTap(template); }}
            onMouseLeave={cancelPress}
            onContextMenu={e => e.preventDefault()}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-earth text-sm">{template.name}</p>
                <p className="text-xs text-earth-light mt-0.5 truncate">
                  {previewNames(template.exerciseIds)}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onStart(template); }}
                disabled={template.exerciseIds.length === 0}
                className="text-sm bg-earth text-cream px-4 py-1.5 rounded-full font-semibold disabled:opacity-40 flex-shrink-0"
              >
                Starta
              </button>
            </div>
          </button>
          {actionId === template.id && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-2">
              <p className="text-sm text-red-600 font-medium truncate flex-1">
                &quot;{template.name}&quot;
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { onEdit(template); setActionId(null); }}
                  className="text-xs text-earth px-3 py-1.5 rounded-lg bg-white border border-sage"
                >
                  Redigera
                </button>
                <button
                  onClick={() => setActionId(null)}
                  className="text-xs text-earth-light px-3 py-1.5 rounded-lg bg-white border border-sage"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => { onDelete(template.id); setActionId(null); }}
                  className="text-xs text-white font-semibold px-3 py-1.5 rounded-lg bg-red-500"
                >
                  Ta bort
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={onNew}
        className="w-full py-3 border border-dashed border-earth-light rounded-2xl text-sm text-earth-light"
      >
        + Ny mall
      </button>
    </div>
  );
}
