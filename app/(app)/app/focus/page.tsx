'use client';
import { useFocusSessions } from '@/lib/hooks/useFocusSessions';
import { FocusTimer } from '@/components/focus/FocusTimer';

export default function FocusPage() {
  const { todayMinutes, logSession } = useFocusSessions();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-earth pt-2 mb-6">Fokusläge</h1>
      <FocusTimer todayMinutes={todayMinutes} onSessionComplete={logSession} />
    </div>
  );
}
