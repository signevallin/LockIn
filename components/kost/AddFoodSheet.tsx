'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { FoodItem } from '@/lib/types';

interface Props {
  open: boolean;
  mealLabel: string;
  onAdd: (item: FoodItem) => void;
  onClose: () => void;
}

interface ParsedFood {
  name: string;
  kcalPer100g: number;
  proteinPer100gG: number;
  fatPer100gG: number;
  carbsPer100gG: number;
}

const PORTIONS = [
  { label: 'Liten', grams: 150 },
  { label: 'Normal', grams: 300 },
  { label: 'Stor', grams: 500 },
];

function calcItem(food: ParsedFood, weightG: number): FoodItem {
  const ratio = weightG / 100;
  return {
    name: food.name,
    weightG,
    kcal: Math.round(food.kcalPer100g * ratio),
    proteinG: Math.round(food.proteinPer100gG * ratio * 10) / 10,
    fatG: Math.round(food.fatPer100gG * ratio * 10) / 10,
    carbsG: Math.round(food.carbsPer100gG * ratio * 10) / 10,
  };
}

export function AddFoodSheet({ open, mealLabel, onAdd, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedFood | null>(null);
  const [weight, setWeight] = useState('300');

  function reset() {
    setDescription('');
    setLoading(false);
    setError(null);
    setParsed(null);
    setWeight('300');
  }

  async function handleAnalyse() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/parse-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() }),
      });
      if (!res.ok) throw new Error('API error');
      const data = (await res.json()) as ParsedFood;
      setParsed(data);
    } catch {
      setError('Kunde inte tolka måltiden — försök igen');
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    if (!parsed) return;
    const w = parseInt(weight, 10);
    if (isNaN(w) || w <= 0) return;
    onAdd(calcItem(parsed, w));
    reset();
    onClose();
  }

  const parsedWeight = parseInt(weight, 10);
  const preview =
    parsed && !isNaN(parsedWeight) && parsedWeight > 0
      ? calcItem(parsed, parsedWeight)
      : null;

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={`Lägg till · ${mealLabel}`}
    >
      {!parsed ? (
        <div className="space-y-3">
          <textarea
            placeholder="Vad åt du? T.ex. kycklingfilé med ris och sallad"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            autoFocus
            className="w-full bg-sky border border-cream-dark rounded-xl px-3 py-2 text-sm text-earth resize-none"
          />
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
          <button
            onClick={handleAnalyse}
            disabled={loading || !description.trim()}
            className="w-full py-2.5 text-sm font-semibold text-cream bg-earth rounded-xl disabled:opacity-40"
          >
            {loading ? 'Analyserar...' : 'Analysera'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-earth">{parsed.name}</p>
          <p className="text-xs text-earth-light">
            {parsed.kcalPer100g} kcal/100g · P:{parsed.proteinPer100gG}g · F:{parsed.fatPer100gG}g · K:{parsed.carbsPer100gG}g
          </p>

          <div>
            <p className="text-xs text-earth-light mb-2">Hur stor portion?</p>
            <div className="flex gap-2 mb-2">
              {PORTIONS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setWeight(String(p.grams))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    weight === String(p.grams)
                      ? 'bg-earth text-cream border-earth'
                      : 'bg-sky text-earth border-cream-dark'
                  }`}
                >
                  <span className="block">{p.label}</span>
                  <span className="block font-normal opacity-70">{p.grams}g</span>
                </button>
              ))}
            </div>
            <input
              type="number"
              inputMode="numeric"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              min="1"
              placeholder="Eller ange gram..."
              className="w-full bg-sky border border-cream-dark rounded-xl px-3 py-2 text-sm text-earth"
            />
          </div>

          {preview && (
            <p className="text-xs text-earth-light">
              {preview.kcal} kcal · P:{preview.proteinG}g · F:{preview.fatG}g · K:{preview.carbsG}g
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setParsed(null)}
              className="flex-1 py-2 text-sm text-earth-light border border-cream-dark rounded-xl"
            >
              Tillbaka
            </button>
            <button
              onClick={handleAdd}
              disabled={!preview}
              className="flex-1 py-2 text-sm font-semibold text-cream bg-earth rounded-xl disabled:opacity-40"
            >
              Lägg till
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
