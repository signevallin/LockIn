'use client';
import { useState } from 'react';
import { useFocusSessions } from '@/lib/hooks/useFocusSessions';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { ActivityChart } from '@/components/progress/ActivityChart';
import { HealthStats } from '@/components/health/HealthStats';
import { HealthSetup } from '@/components/health/HealthSetup';

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export default function ProgressPage() {
  const { sessions, todayMinutes, loading } = useFocusSessions();
  const { goals } = useHealthGoals();
  const [period, setPeriod] = useState<'vecka' | 'månad'>('vecka');
  const [activeTab, setActiveTab] = useState<'fokus' | 'hälsa'>('fokus');

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-earth pt-2">Min progress</h1>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-sky rounded-2xl p-3 shadow-sm border border-cream-dark h-14 animate-pulse" />
          ))}
        </div>
        <div className="bg-sky rounded-2xl p-4 shadow-sm border border-cream-dark h-32 animate-pulse" />
      </div>
    );
  }

  const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0
  const weekData = DAY_LABELS.map((label, i) => ({
    label,
    value: i === todayIdx ? todayMinutes : 0,
    isToday: i === todayIdx,
  }));

  const totalHours = Math.floor(todayMinutes / 60);
  const totalMins = todayMinutes % 60;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-earth pt-2">Min progress</h1>

      {/* Main Fokus / Hälsa toggle */}
      <div className="flex gap-2">
        {(['fokus', 'hälsa'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-earth text-cream'
                : 'bg-cream-dark text-earth-light'
            }`}
          >
            {tab === 'fokus' ? 'Fokus' : 'Hälsa'}
          </button>
        ))}
      </div>

      {activeTab === 'fokus' ? (
        <>
          {/* Period toggle */}
          <div className="flex gap-2">
            {(['vecka', 'månad'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  period === p
                    ? 'bg-earth text-cream'
                    : 'bg-cream-dark text-earth-light'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Fokus idag', value: `${totalHours}h ${totalMins}m` },
              { label: 'Sessioner', value: sessions.length.toString() },
              { label: 'Streak', value: '—' },
            ].map(stat => (
              <div
                key={stat.label}
                className="bg-sky rounded-2xl p-3 shadow-sm border border-cream-dark text-center"
              >
                <p className="text-lg font-bold text-earth">{stat.value}</p>
                <p className="text-xs text-earth-light">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-sky rounded-2xl p-4 shadow-sm border border-cream-dark">
            <p className="text-xs uppercase tracking-widest text-earth-light mb-3">
              Veckans aktivitet (min)
            </p>
            <ActivityChart data={weekData} />
          </div>
        </>
      ) : goals?.healthSyncToken ? (
        <HealthStats />
      ) : (
        <HealthSetup />
      )}
    </div>
  );
}
