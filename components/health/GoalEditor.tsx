'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { HealthGoals } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  current: HealthGoals | null;
  onSave: (dailySteps: number, dailyCalories: number) => Promise<void>;
}

export function GoalEditor({ open, onClose, current, onSave }: Props) {
  const [steps, setSteps] = useState('10000');
  const [calories, setCalories] = useState('2500');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSteps(current?.dailySteps?.toString() ?? '10000');
    setCalories(current?.dailyCalories?.toString() ?? '2500');
    setError('');
  }, [open, current]);

  async function handleSave() {
    const s = parseInt(steps, 10);
    const c = parseInt(calories, 10);
    if (!s || s <= 0 || !c || c <= 0) {
      setError('Ange giltiga positiva heltal.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(s, c);
      onClose();
    } catch {
      setError('Kunde inte spara. Försök igen.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dagliga mål"
      footer={
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Sparar...' : 'Spara'}
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-earth-light mb-1">👟 Dagligt stepmål</label>
          <input
            type="number"
            inputMode="numeric"
            value={steps}
            onChange={e => setSteps(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
          />
        </div>
        <div>
          <label className="block text-xs text-earth-light mb-1">🔥 Dagligt kalorismål (kcal totalt inkl. vila)</label>
          <input
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={e => setCalories(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
