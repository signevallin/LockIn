'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { generateMilestones } from '@/lib/utils/milestones';
import type { UserPromise } from '@/lib/types';

const CATEGORIES = ['💪 Hälsa', '📚 Utveckling', '💼 Karriär', '💰 Ekonomi', '🧠 Mindset'];
const CHARITIES = ['Rädda Barnen', 'WWF', 'BRIS', 'Röda Korset', 'Cancerfonden', 'Läkare utan gränser'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<UserPromise, 'id' | 'createdAt' | 'status'>) => Promise<void>;
}

export function PromiseForm({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [deadline, setDeadline] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [charityOrg, setCharityOrg] = useState(CHARITIES[0]);
  const [saving, setSaving] = useState(false);

  const durationDays = deadline
    ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
    : 0;

  const formattedPromise = title && deadline && stakeAmount
    ? `Jag lovar att ${title.toLowerCase()}. Om jag inte lyckas innan ${new Date(deadline).toLocaleDateString('sv-SE')} skänker jag ${stakeAmount} kr till ${charityOrg}.`
    : '';

  function resetForm() {
    setStep(1);
    setTitle('');
    setCategory(CATEGORIES[0]);
    setDeadline('');
    setStakeAmount('');
    setCharityOrg(CHARITIES[0]);
  }

  async function handleSubmit() {
    if (!title || !deadline || !stakeAmount || saving) return;
    setSaving(true);
    try {
      const deadlineDate = new Date(deadline);
      await onSubmit({
        title,
        category,
        deadline: deadlineDate,
        durationDays,
        stakeAmount: Number(stakeAmount),
        charityOrg,
        milestones: generateMilestones(new Date(), deadlineDate),
      });
      resetForm();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Nytt löfte — Steg ${step}/3`}>
      <div className="flex gap-1 mb-4">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full ${step >= s ? 'bg-earth' : 'bg-cream-dark'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-earth-light">Vad lovar du?</p>
          <textarea
            placeholder="T.ex. träna 4 gånger per vecka"
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm resize-none focus:outline-none focus:border-earth"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm bg-white focus:outline-none focus:border-earth"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <Button size="lg" onClick={() => setStep(2)} disabled={!title}>Nästa →</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-earth-light">Deadline och tid</p>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
          />
          {deadline && (
            <div className="bg-bay rounded-xl p-3 text-sm text-earth">
              <p><strong>{durationDays} dagar</strong> till deadline</p>
              <p className="text-earth-light mt-1">Milstolpar genereras automatiskt vid 25%, 50% och 75%.</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>← Tillbaka</Button>
            <Button size="lg" className="flex-1" onClick={() => setStep(3)} disabled={!deadline}>Nästa →</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm text-earth-light">Insats (hedersbaserad)</p>
          <input
            type="number"
            placeholder="Belopp i kr"
            value={stakeAmount}
            onChange={e => setStakeAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
          />
          <select
            value={charityOrg}
            onChange={e => setCharityOrg(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm bg-white focus:outline-none focus:border-earth"
          >
            {CHARITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {formattedPromise && (
            <div className="bg-bay rounded-xl p-3 text-sm text-earth italic">
              &quot;{formattedPromise}&quot;
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>← Tillbaka</Button>
            <Button size="lg" className="flex-1" onClick={handleSubmit} disabled={saving || !stakeAmount}>
              {saving ? 'Sparar...' : 'Lås in löftet 🔒'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
