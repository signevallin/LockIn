'use client';
import { useState } from 'react';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { useHealthData } from '@/lib/hooks/useHealthData';
import { useHealthWeek } from '@/lib/hooks/useHealthWeek';
import { GoalEditor } from './GoalEditor';
import { ActivityChart } from '@/components/progress/ActivityChart';
import { SHORTCUT_URL } from '@/lib/health/shortcut';

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Short Swedish weekday labels Mon–Sun (Mon = index 0)
const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(value / max, 1) * 100;
  return (
    <div className="bg-cream-dark rounded-full h-1.5 mt-1.5 overflow-hidden">
      <div className="bg-earth h-full rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function HealthStats() {
  const { goals, saveGoals } = useHealthGoals();
  const today = todayDate();
  const { data } = useHealthData(today);
  const { days } = useHealthWeek();
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Build chart data: one entry per day, oldest→newest, matching ActivityChart's prop shape
  const chartData = days.map(d => {
    // Parse date as noon local time to avoid timezone-shift day flips
    const date = new Date(d.date + 'T12:00:00');
    const dayIdx = (date.getDay() + 6) % 7; // getDay(): 0=Sun → Mon=1 becomes 0
    return {
      label: DAY_LABELS[dayIdx],
      value: d.data?.steps ?? 0,
      isToday: d.date === today,
    };
  });

  const syncLabel = data?.syncedAt
    ? `Senast synkat: ${data.syncedAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`
    : 'Aldrig synkat';

  return (
    <>
      <div className="space-y-3">
        {/* Today's numbers */}
        <div className="bg-sky rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-earth-light mb-3">Idag</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-earth">
                {data ? Math.round(data.steps).toLocaleString('sv-SE') : '—'}
              </p>
              <p className="text-xs text-earth-light">👟 steg</p>
              {data && goals && (
                <>
                  <ProgressBar value={data.steps} max={goals.dailySteps} />
                  <p className="text-xs text-earth-light mt-1">
                    / {goals.dailySteps.toLocaleString('sv-SE')}
                  </p>
                </>
              )}
            </div>
            <div>
              <p className="text-xl font-bold text-earth">
                {data ? Math.round(data.totalCalories).toLocaleString('sv-SE') : '—'}
              </p>
              <p className="text-xs text-earth-light">🔥 kcal</p>
              {data && goals && (
                <>
                  <ProgressBar value={data.totalCalories} max={goals.dailyCalories} />
                  <p className="text-xs text-earth-light mt-1">
                    / {goals.dailyCalories.toLocaleString('sv-SE')}
                  </p>
                </>
              )}
            </div>
            <div>
              <p className="text-xl font-bold text-earth">
                {data ? Math.round(data.workoutMinutes) : '—'}
              </p>
              <p className="text-xs text-earth-light">💪 träningsmin</p>
            </div>
          </div>
        </div>

        {/* Weekly steps chart — reuses ActivityChart from the Fokus tab */}
        {chartData.length > 0 && (
          <div className="bg-sky rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest text-earth-light mb-3">
              Steg · 7 dagar
            </p>
            <ActivityChart data={chartData} />
          </div>
        )}

        {/* Goals row */}
        <div className="bg-sky rounded-2xl p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-earth font-medium truncate">
              Mål: {goals?.dailySteps?.toLocaleString('sv-SE') ?? '—'} steg ·{' '}
              {goals?.dailyCalories?.toLocaleString('sv-SE') ?? '—'} kcal
            </p>
            <p className="text-xs text-earth-light">{syncLabel}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowToken(v => !v)}
              className="text-xs text-earth border border-sage bg-white px-3 py-1.5 rounded-lg"
            >
              Token
            </button>
            <button
              onClick={() => setGoalEditorOpen(true)}
              className="text-xs text-earth border border-sage bg-white px-3 py-1.5 rounded-lg"
            >
              Ändra mål
            </button>
          </div>
        </div>

        {/* Token panel — shown when user taps "Token" */}
        {showToken && goals?.healthSyncToken && (
          <div className="bg-sky rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-earth">Din synk-token</p>
            <div className="bg-white rounded-xl border border-sage px-3 py-2 font-mono text-xs text-earth break-all select-all">
              {goals.healthSyncToken}
            </div>
            <ol className="space-y-2 text-xs text-earth">
              <li><span className="font-semibold">1.</span> <a href={SHORTCUT_URL} target="_blank" rel="noopener noreferrer" className="underline text-earth-light">Hämta Shortcutet →</a></li>
              <li><span className="font-semibold">2.</span> Klistra in token när du installerar Shortcutet</li>
              <li><span className="font-semibold">3.</span> Shortcuts → Automatisering → tre automationer: <strong>08:00, 12:00, 20:00</strong></li>
            </ol>
          </div>
        )}
      </div>

      <GoalEditor
        open={goalEditorOpen}
        onClose={() => setGoalEditorOpen(false)}
        current={goals}
        onSave={saveGoals}
      />
    </>
  );
}
