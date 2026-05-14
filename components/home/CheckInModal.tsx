'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { CheckIn } from '@/lib/types';

const MOODS: { value: CheckIn['mood']; emoji: string; label: string }[] = [
  { value: 1, emoji: '😔', label: 'Dålig' },
  { value: 2, emoji: '😕', label: 'Ok' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Bra' },
  { value: 5, emoji: '😄', label: 'Fantastisk' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (mood: CheckIn['mood'], reflection: string) => Promise<void>;
}

export function CheckInModal({ open, onClose, onSubmit }: Props) {
  const [mood, setMood] = useState<CheckIn['mood']>(3);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit(mood, reflection);
      setMood(3);
      setReflection('');
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Daglig incheckning">
      <p className="text-sm text-earth-light mb-4">Hur mår du idag?</p>
      <div className="flex justify-between mb-6">
        {MOODS.map(m => (
          <button
            key={m.value}
            onClick={() => setMood(m.value)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${mood === m.value ? 'bg-bay' : ''}`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-xs text-earth-light">{m.label}</span>
          </button>
        ))}
      </div>
      <textarea
        placeholder="Skriv en reflektion (valfritt)..."
        value={reflection}
        onChange={e => setReflection(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm resize-none focus:outline-none focus:border-earth mb-4"
      />
      <Button size="lg" onClick={handleSubmit} disabled={saving}>
        {saving ? 'Sparar...' : 'Checka in ✓'}
      </Button>
    </Modal>
  );
}
