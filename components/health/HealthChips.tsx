'use client';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { useHealthData } from '@/lib/hooks/useHealthData';

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(value / max, 1) * 100;
  return (
    <div className="bg-cream-dark rounded-full h-1 mt-1.5 overflow-hidden">
      <div className="bg-earth h-full rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function HealthChips() {
  const { goals } = useHealthGoals();
  const { data } = useHealthData(todayDate());

  // Only render once the user has set up the Shortcut integration
  if (!goals?.healthSyncToken) return null;

  const steps = data?.steps != null ? Math.round(data.steps) : null;
  const calories = data?.totalCalories != null ? Math.round(data.totalCalories) : null;

  return (
    <div className="flex gap-3">
      <div className="flex-1 bg-sky rounded-2xl p-3 text-center">
        <p className="text-base font-bold text-earth">
          {steps !== null ? steps.toLocaleString('sv-SE') : '—'}
        </p>
        <p className="text-xs text-earth-light">
          👟 steg / {goals.dailySteps.toLocaleString('sv-SE')}
        </p>
        {steps !== null && <ProgressBar value={steps} max={goals.dailySteps} />}
      </div>
      <div className="flex-1 bg-sky rounded-2xl p-3 text-center">
        <p className="text-base font-bold text-earth">
          {calories !== null ? calories.toLocaleString('sv-SE') : '—'}
        </p>
        <p className="text-xs text-earth-light">
          🔥 kcal / {goals.dailyCalories.toLocaleString('sv-SE')}
        </p>
        {calories !== null && <ProgressBar value={calories} max={goals.dailyCalories} />}
      </div>
    </div>
  );
}