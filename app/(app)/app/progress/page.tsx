'use client';
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { useWeightHistory } from '@/lib/hooks/useWeightHistory';
import { HealthStats } from '@/components/health/HealthStats';
import { HealthSetup } from '@/components/health/HealthSetup';
import { ViktTab } from '@/components/stats/ViktTab';
import { TabSwitcher } from '@/components/ui/TabSwitcher';

type Tab = 'hälsa' | 'vikt';
const TABS: { key: Tab; label: string }[] = [
  { key: 'hälsa', label: 'Hälsa' },
  { key: 'vikt', label: 'Vikt' },
];

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function ProgressPage() {
  const { user } = useAuth();
  const { goals } = useHealthGoals();
  const [activeTab, setActiveTab] = useState<Tab>('hälsa');
  const { weeklyWeights, latestWeight, previousWeekWeight, refresh } = useWeightHistory();

  const [weightOpen, setWeightOpen] = useState(false);
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
      await setDoc(
        doc(db, 'users', user.uid, 'health_data', todayDate()),
        { weight: rounded },
        { merge: true },
      );
      setSaved(true);
      setWeightInput('');
      refresh();
      setTimeout(() => {
        setSaved(false);
        setWeightOpen(false);
      }, 800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-earth">Min progress</h1>
        {activeTab === 'vikt' && !weightOpen && (
          <button
            onClick={() => { setWeightOpen(true); setSaved(false); }}
            className="text-sm bg-bay text-earth px-3 py-1.5 rounded-full font-medium"
          >
            Logga vikt →
          </button>
        )}
      </div>

      {/* Weight input inline panel */}
      {weightOpen && activeTab === 'vikt' && (
        <div className="bg-sky rounded-2xl p-4 flex gap-2 items-center">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="30"
            max="300"
            autoFocus
            placeholder={latestWeight !== null ? String(latestWeight) : '0.0'}
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSaveWeight()}
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
          <button
            onClick={() => { setWeightOpen(false); setWeightInput(''); }}
            className="text-earth-light text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab toggle */}
      <TabSwitcher tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'hälsa' && (
        goals?.healthSyncToken ? <HealthStats /> : <HealthSetup />
      )}

      {activeTab === 'vikt' && (
        <ViktTab
          weeklyWeights={weeklyWeights}
          latestWeight={latestWeight}
          previousWeekWeight={previousWeekWeight}
        />
      )}
    </div>
  );
}
