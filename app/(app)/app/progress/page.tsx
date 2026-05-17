'use client';
import { useState } from 'react';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { HealthStats } from '@/components/health/HealthStats';
import { HealthSetup } from '@/components/health/HealthSetup';
import { ViktTab } from '@/components/stats/ViktTab';

type Tab = 'hälsa' | 'vikt';
const TABS: { key: Tab; label: string }[] = [
  { key: 'hälsa', label: 'Hälsa' },
  { key: 'vikt', label: 'Vikt' },
];

export default function ProgressPage() {
  const { goals } = useHealthGoals();
  const [activeTab, setActiveTab] = useState<Tab>('hälsa');

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-earth pt-2">Min progress</h1>

      {/* Tab toggle */}
      <div className="flex gap-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-earth text-cream'
                : 'bg-cream-dark text-earth-light'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'hälsa' && (
        goals?.healthSyncToken ? <HealthStats /> : <HealthSetup />
      )}

      {activeTab === 'vikt' && <ViktTab />}
    </div>
  );
}
