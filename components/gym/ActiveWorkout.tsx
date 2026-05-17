'use client';
import { useState } from 'react';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { ExerciseRow } from './ExerciseRow';
import { getExerciseById } from '@/lib/gym/exercises';
import type { WorkoutTemplate, WorkoutExercise, SessionExercise, WorkoutSet } from '@/lib/types';

interface Props {
  template: WorkoutTemplate;
  getLastSet: (exerciseId: string) => WorkoutSet | null;
  onFinish: (exercises: SessionExercise[]) => Promise<void>;
  onBack: () => void;
}

export function ActiveWorkout({ template, getLastSet, onFinish, onBack }: Props) {
  const initialExercises: WorkoutExercise[] = template.exerciseIds.map(id => {
    const ex = getExerciseById(id);
    return ex ?? { id, name: id, category: 'Bröst' as const, type: 'free_weight' as const };
  });

  const [exercises, setExercises] = useState<WorkoutExercise[]>(initialExercises);
  const [setsByExercise, setSetsByExercise] = useState<Record<string, WorkoutSet[]>>({});
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');

  function addSet(exerciseId: string, set: WorkoutSet) {
    setSetsByExercise(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] ?? []), set],
    }));
  }

  function addExercise(ex: WorkoutExercise) {
    setExercises(prev => [...prev, ex]);
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    setError('');
    try {
      const sessionExercises: SessionExercise[] = exercises.map(ex => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: setsByExercise[ex.id] ?? [],
      }));
      await onFinish(sessionExercises);
    } catch {
      setError('Kunde inte spara passet. Försök igen.');
      setFinishing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={onBack} className="text-earth-light text-sm">← Tillbaka</button>
        <h1 className="text-xl font-bold text-earth flex-1 truncate">{template.name}</h1>
      </div>

      <div className="space-y-3">
        {exercises.map(ex => (
          <ExerciseRow
            key={ex.id}
            exerciseId={ex.id}
            exerciseName={ex.name}
            exerciseType={ex.type}
            lastSet={getLastSet(ex.id)}
            sets={setsByExercise[ex.id] ?? []}
            onAddSet={set => addSet(ex.id, set)}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="flex gap-3 pb-6">
        <button
          onClick={() => setLibraryOpen(true)}
          className="flex-1 py-3 border border-dashed border-earth-light rounded-2xl text-sm text-earth-light"
        >
          + Lägg till övning
        </button>
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="flex-1 py-3 bg-earth text-cream rounded-2xl text-sm font-semibold disabled:opacity-50"
        >
          {finishing ? 'Sparar...' : 'Avsluta pass ✓'}
        </button>
      </div>

      <ExerciseLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={addExercise}
        excludeIds={exercises.map(e => e.id)}
      />
    </div>
  );
}
