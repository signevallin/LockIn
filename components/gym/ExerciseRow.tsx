'use client';
import { useState } from 'react';
import type { WorkoutSet, ExerciseType } from '@/lib/types';

const TYPE_LABEL: Record<ExerciseType, string> = {
  free_weight: 'Fri vikt',
  machine: 'Maskin',
  bodyweight: 'Kroppsvikt',
};

interface Props {
  exerciseId: string;
  exerciseName: string;
  exerciseType: ExerciseType;
  lastSet: WorkoutSet | null; // from previous session
  sets: WorkoutSet[];         // logged in this session so far
  onAddSet: (set: WorkoutSet) => void;
}

export function ExerciseRow({ exerciseName, exerciseType, lastSet, sets, onAddSet }: Props) {
  // Pre-fill with last set in current session, or previous session suggestion, or empty.
  const suggestion = sets.length > 0 ? sets[sets.length - 1] : lastSet;
  const [weight, setWeight] = useState(suggestion?.weight?.toString() ?? '');
  const [reps, setReps] = useState(suggestion?.reps?.toString() ?? '');

  function handleAddSet() {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return;
    onAddSet({ weight: w, reps: r });
    // Keep same values pre-filled for next set
    setWeight(w.toString());
    setReps(r.toString());
  }

  return (
    <div className="bg-sky rounded-2xl p-4">
      <div className="flex items-baseline gap-2 mb-1">
        <p className="font-bold text-earth text-sm">{exerciseName}</p>
        <span className="text-xs text-earth-light">{TYPE_LABEL[exerciseType] ?? exerciseType}</span>
      </div>
      {sets.length === 0 && lastSet && (
        <p className="text-xs text-earth-light mb-2">
          💡 Förra gången: {lastSet.weight}kg × {lastSet.reps} reps
        </p>
      )}
      {sets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sets.map((s, i) => (
            <span
              key={i}
              className="bg-earth text-cream text-xs font-semibold px-2.5 py-1 rounded-lg"
            >
              {s.weight}kg × {s.reps}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="kg"
          className="w-16 px-2 py-1.5 rounded-lg border border-sage bg-white text-earth text-sm text-center focus:outline-none focus:border-earth"
        />
        <span className="text-xs text-earth-light">kg ×</span>
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={e => setReps(e.target.value)}
          placeholder="reps"
          className="w-14 px-2 py-1.5 rounded-lg border border-sage bg-white text-earth text-sm text-center focus:outline-none focus:border-earth"
        />
        <span className="text-xs text-earth-light">reps</span>
        <button
          onClick={handleAddSet}
          className="ml-auto bg-cream-dark text-earth text-xs font-semibold px-3 py-1.5 rounded-lg"
        >
          + Set
        </button>
      </div>
    </div>
  );
}
