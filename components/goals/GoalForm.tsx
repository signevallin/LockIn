'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Goal } from '@/lib/types';

const CATEGORIES = ['💪 Hälsa', '📚 Utveckling', '💼 Karriär', '💰 Ekonomi', '🧠 Mindset', '❤️ Relationer'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Goal, 'id' | 'createdAt' | 'progress'>, subGoalTitles: string[]) => Promise<void>;
}

export function GoalForm({ open, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [deadline, setDeadline] = useState('');
  const [subGoalInput, setSubGoalInput] = useState('');
  const [subGoals, setSubGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function addSubGoal() {
    if (!subGoalInput.trim()) return;
    setSubGoals(prev => [...prev, subGoalInput.trim()]);
    setSubGoalInput('');
  }

  async function handleSubmit() {
    if (!title || !deadline || saving) return;
    setSaving(true);
    try {
      await onSubmit({ title, category, deadline: new Date(deadline) }, subGoals);
      setTitle('');
      setCategory(CATEGORIES[0]);
      setDeadline('');
      setSubGoals([]);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nytt mål"
      footer={
        <Button size="lg" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Sparar...' : 'Skapa mål'}
        </Button>
      }
    >
      <div className="space-y-3">
        <input
          placeholder="Vad vill du uppnå?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth bg-white"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
        />
        <div>
          <p className="text-xs text-earth-light mb-2">Delmål</p>
          {subGoals.map((sg, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="text-xs text-earth-light">•</span>
              <span className="text-sm text-earth flex-1">{sg}</span>
              <button onClick={() => setSubGoals(prev => prev.filter((_, j) => j !== i))} className="text-earth-light text-xs">✕</button>
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <input
              placeholder="Lägg till delmål..."
              value={subGoalInput}
              onChange={e => setSubGoalInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubGoal()}
              className="flex-1 px-3 py-1.5 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
            />
            <Button variant="outline" size="sm" onClick={addSubGoal}>+</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
