'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { getExerciseById } from '@/lib/gym/exercises';
import type { WorkoutExercise, WorkoutTemplate } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, exerciseIds: string[]) => Promise<void>;
  existing?: WorkoutTemplate;
}

export function WorkoutTemplateForm({ open, onClose, onSubmit, existing }: Props) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setName(existing.name);
      const resolved = existing.exerciseIds.map(id => {
        const found = getExerciseById(id);
        return found ?? { id, name: id, category: 'Bröst' as const, type: 'free_weight' as const };
      });
      setExercises(resolved);
    } else {
      setName('');
      setExercises([]);
    }
  }, [open, existing]);

  function moveUp(index: number) {
    if (index === 0) return;
    setExercises(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === exercises.length - 1) return;
    setExercises(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setExercises(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSubmit(name.trim(), exercises.map(e => e.id));
      onClose();
    } catch {
      setError('Kunde inte spara. Försök igen.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={existing ? 'Redigera mall' : 'Ny mall'}
        footer={
          <Button size="lg" onClick={handleSubmit} disabled={!name.trim() || saving}>
            {saving ? 'Sparar...' : 'Spara mall'}
          </Button>
        }
      >
        <div className="space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Namn på passet (t.ex. Push-dag)"
            className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
          />
          {exercises.length > 0 && (
            <>
              <p className="text-xs text-earth-light">Övningar</p>
              <div className="space-y-1">
                {exercises.map((ex, i) => (
                  <div key={`${ex.id}-${i}`} className="flex items-center gap-2 bg-sky rounded-xl px-3 py-2">
                    <span className="flex-1 text-sm text-earth">{ex.name}</span>
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="text-earth-light disabled:opacity-30 px-1 text-sm leading-none"
                      aria-label="Flytta upp"
                    >▲</button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === exercises.length - 1}
                      className="text-earth-light disabled:opacity-30 px-1 text-sm leading-none"
                      aria-label="Flytta ned"
                    >▼</button>
                    <button
                      onClick={() => remove(i)}
                      className="text-earth-light px-1 text-sm leading-none"
                      aria-label="Ta bort"
                    >✕</button>
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setLibraryOpen(true)}
            className="w-full py-2.5 border border-dashed border-earth-light rounded-xl text-sm text-earth-light"
          >
            + Lägg till övning
          </button>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
      </Modal>
      <ExerciseLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={ex => setExercises(prev => [...prev, ex])}
        excludeIds={exercises.map(e => e.id)}
      />
    </>
  );
}
