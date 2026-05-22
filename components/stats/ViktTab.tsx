'use client';
import { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHealthWeek } from '@/lib/hooks/useHealthWeek';
import { useWeeklyNutrition } from '@/lib/hooks/useWeeklyNutrition';
import { useWeightHistory } from '@/lib/hooks/useWeightHistory';
import { BurnedVsConsumedChart } from './BurnedVsConsumedChart';
import { PlanVsActualChart } from './PlanVsActualChart';

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function signedKg(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)} kg`;
}

export function ViktTab() {
  const today = todayDate();
  const { user } = useAuth();
  const { days: healthDays } = useHealthWeek();
  const { days: nutritionDays, totalConsumedKcal } = useWeeklyNutrition();
  const { weeklyWeights, latestWeight, previousWeekWeight, refresh } = useWeightHistory();

  const [weightInput, setWeightInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveWeight() {
    if (!user || !weightInput.trim()) return;
    const parsed = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    const rounded = Math.round(parsed * 10) / 10;
    setSaving(true);
    try {
      const ref = doc(db, 'users', user.uid, 'health_data', today);
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data() : {};
      await setDoc(ref, { ...existing, weight: rounded }, { merge: true });
      setSaved(true);
      setWeightInput('');
      refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const totalBurnedKcal = healthDays.reduce(
    (s, d) => s + (d.data?.totalCalories ?? 0),
    0,
  );
  const weeklyDeficit = totalBurnedKcal - totalConsumedKcal;
  const expectedKgChange = -weeklyDeficit / 7700;
  const actualKgChange =
    latestWeight !== null && previousWeekWeight !== null
      ? latestWeight - previousWeekWeight
      : null;

  // Build chart data: one entry per day, matching health_data dates
  const chartDays = healthDays.map(h => {
    const date = new Date(h.date + 'T12:00:00');
    const dayIdx = (date.getDay() + 6) % 7; // Mon = 0
    const nutrition = nutritionDays.find(n => n.date === h.date);
    return {
      label: h.date === today ? 'Idag' : DAY_LABELS[dayIdx],
      burnedKcal: h.data?.totalCalories ?? 0,
      consumedKcal: nutrition?.consumedKcal ?? 0,
      isToday: h.date === today,
    };
  });

  return (
    <div className="space-y-3">
      {/* Weight input */}
      <div className="bg-sky rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-earth-light mb-3">
          Logga vikt · idag
        </p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="30"
            max="300"
            placeholder={latestWeight !== null ? String(latestWeight) : '0.0'}
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            className="flex-1 rounded-xl bg-cream px-3 py-2 text-earth text-sm outline-none"
          />
          <span className="text-earth-light text-sm">kg</span>
          <button
            onClick={handleSaveWeight}
            disabled={saving || !weightInput.trim()}
            className="rounded-xl bg-earth text-cream px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {saved ? '✓' : saving ? '…' : 'Spara'}
          </button>
        </div>
      </div>

      {/* Section A: Burned vs consumed line chart */}
      <div className="bg-sky rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-earth-light mb-3">
          Förbränning vs intag · 7 dagar
        </p>
        <BurnedVsConsumedChart days={chartDays} />
      </div>

      {/* Section B: Weekly energy balance */}
      <div className="bg-sky rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-earth-light mb-3">
          Denna vecka · energibalans
        </p>
        <div className="flex justify-between items-center">
          <div className="text-center">
            <p className="text-lg font-bold text-earth">
              {Math.round(totalBurnedKcal).toLocaleString('sv-SE')}
            </p>
            <p className="text-xs text-earth-light">🔥 förbrända</p>
          </div>
          <p className="text-earth-light text-xl">−</p>
          <div className="text-center">
            <p className="text-lg font-bold text-earth">
              {Math.round(totalConsumedKcal).toLocaleString('sv-SE')}
            </p>
            <p className="text-xs text-earth-light">🍽 intagna</p>
          </div>
          <p className="text-earth-light text-xl">=</p>
          <div className="text-center">
            <p className={`text-lg font-bold ${weeklyDeficit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {weeklyDeficit >= 0 ? '+' : ''}{Math.round(weeklyDeficit).toLocaleString('sv-SE')}
            </p>
            <p className="text-xs text-earth-light">
              {weeklyDeficit >= 0 ? 'underskott' : 'överskott'} kcal
            </p>
          </div>
        </div>
      </div>

      {/* Section C: Weight delta this week */}
      <div className="bg-sky rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-earth-light mb-3">
          Denna vecka · vikt
        </p>
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <p className={`text-lg font-bold ${expectedKgChange <= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {signedKg(expectedKgChange)}
            </p>
            <p className="text-xs text-earth-light">förväntat</p>
            <p className="text-xs text-earth-light">
              {Math.round(weeklyDeficit)} kcal ÷ 7 700
            </p>
          </div>
          <div className="w-px bg-cream-dark" />
          <div className="flex-1 text-center">
            {actualKgChange !== null ? (
              <>
                <p className={`text-lg font-bold ${actualKgChange <= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {signedKg(actualKgChange)}
                </p>
                <p className="text-xs text-earth-light">utfall vs förra veckan</p>
                <p className="text-xs text-earth-light">från Apple Hälsa</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-earth-light">—</p>
                <p className="text-xs text-earth-light">utfall vs förra veckan</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section D: Plan vs actual weight over 10 weeks */}
      <div className="bg-sky rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-earth-light mb-3">
          Plan vs utfall · 10 veckor
        </p>
        {/* Legend */}
        <div className="flex gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="4" viewBox="0 0 14 4" aria-hidden="true">
              <line x1="0" y1="2" x2="14" y2="2" stroke="#513229" strokeWidth="1.5" strokeDasharray="3,2" />
            </svg>
            <span className="text-xs text-earth-light">Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full border-2 border-earth" style={{ background: '#f0d48e' }} />
            <span className="text-xs text-earth-light">Faktisk vikt</span>
          </div>
        </div>
        <PlanVsActualChart
          weeklyWeights={weeklyWeights}
          weeklyDeficitKcal={weeklyDeficit}
        />
      </div>
    </div>
  );
}