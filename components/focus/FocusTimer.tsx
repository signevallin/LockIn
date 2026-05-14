'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Button } from '@/components/ui/Button';
import type { FocusSession } from '@/lib/types';

const MODES: { key: FocusSession['mode']; label: string; minutes: number }[] = [
  { key: 'focus', label: 'Focus', minutes: 25 },
  { key: 'deep_work', label: 'Deep Work', minutes: 90 },
  { key: 'study', label: 'Study', minutes: 50 },
  { key: 'custom', label: 'Custom', minutes: 30 },
];

interface Props {
  todayMinutes: number;
  onSessionComplete: (mode: FocusSession['mode'], minutes: number) => Promise<void>;
}

export function FocusTimer({ todayMinutes, onSessionComplete }: Props) {
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const totalSeconds = useMemo(
    () => (selectedMode.key === 'custom' ? customMinutes : selectedMode.minutes) * 60,
    [selectedMode, customMinutes]
  );
  const percent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const handleComplete = useCallback(async () => {
    setRunning(false);
    await onSessionComplete(
      selectedMode.key,
      selectedMode.key === 'custom' ? customMinutes : selectedMode.minutes
    );
    setSecondsLeft(totalSeconds);
  }, [selectedMode, customMinutes, onSessionComplete, totalSeconds]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          completedRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && completedRef.current) {
      completedRef.current = false;
      handleComplete();
    }
  }, [secondsLeft, handleComplete]);

  useEffect(() => {
    const mins = selectedMode.key === 'custom' ? customMinutes : selectedMode.minutes;
    setSecondsLeft(mins * 60);
    setRunning(false);
    completedRef.current = false;
  }, [selectedMode, customMinutes]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (running) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [running]);

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  const todayHours = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => !running && setSelectedMode(m)}
            disabled={running}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${selectedMode.key === m.key ? 'bg-earth text-cream' : 'bg-cream-dark text-earth-light'} disabled:opacity-50`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {selectedMode.key === 'custom' && !running && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-earth-light">Minuter:</label>
          <input
            type="number"
            min={1} max={300}
            value={customMinutes}
            onChange={e => setCustomMinutes(Math.max(1, Math.min(300, Number(e.target.value))))}
            className="w-20 px-3 py-1.5 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth"
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <ProgressRing percent={percent} size={160} strokeWidth={8} label={`${mins}:${secs}`} />
        <p className="text-sm text-earth-light">Dags att låsa in. Du klarar detta.</p>
        <Button
          size="lg"
          onClick={() => setRunning(r => !r)}
          variant={running ? 'outline' : 'primary'}
        >
          {running ? 'Pausa' : secondsLeft < totalSeconds ? 'Fortsätt' : 'Starta fokus'}
        </Button>
        <p className="text-sm text-earth-light">
          Idag fokuserat <span className="text-earth font-semibold">{todayHours}h {todayMins}m</span>
        </p>
      </div>
    </div>
  );
}
