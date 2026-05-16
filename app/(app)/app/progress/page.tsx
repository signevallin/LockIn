'use client';
import { useState } from 'react';
import { useFocusSessions } from '@/lib/hooks/useFocusSessions';
import { ActivityChart } from '@/components/progress/ActivityChart';

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export default function ProgressPage() {
  const { sessions, todayMinutes, loading } = useFocusSessions();
  const [period, setPeriod] = useState<'vecka' | 'månad'>('vecka');

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
    value: 0,
    isToday: i === todayIdx,
  }));
  weekData[todayIdx].value = todayMinutes;

  const totalHours = Math.floor(todayMinutes / 60);
  const totalMins = todayMinutes % 60;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-earth pt-2">Min progress</h1>

      <div className="flex gap-2">
        {(['vecka', 'månad'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${period === p ? 'bg-earth text-cream' : 'bg-cream-dark text-earth-light'}`}
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
          <div key={stat.label} className="bg-sky rounded-2xl p-3 shadow-sm border border-cream-dark text-center">
            <p className="text-lg font-bold text-earth">{stat.value}</p>
            <p className="text-xs text-earth-light">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-sky rounded-2xl p-4 shadow-sm border border-cream-dark">
        <p className="text-xs uppercase tracking-widest text-earth-light mb-3">Veckans aktivitet (min)</p>
        <ActivityChart data={weekData} />
      </div>
    </div>
  );
}
