'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { STATIC_EXERCISES, EXERCISE_CATEGORIES } from '@/lib/gym/exercises';
import type { WorkoutExercise, ExerciseCategory, ExerciseType } from '@/lib/types';

const TYPE_LABEL: Record<ExerciseType, string> = {
  free_weight: 'Fri vikt',
  machine: 'Maskin',
  bodyweight: 'Kroppsvikt',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: WorkoutExercise) => void;
  excludeIds?: string[];
}

export function ExerciseLibraryModal({ open, onClose, onSelect, excludeIds = [] }: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | 'Alla'>('Alla');
  const [customExercises, setCustomExercises] = useState<WorkoutExercise[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('Bröst');
  const [newType, setNewType] = useState<ExerciseType>('free_weight');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset form state on close
      setSearch('');
      setCategory('Alla');
      setShowCreateForm(false);
      setNewName('');
      setNewCategory('Bröst');
      setNewType('free_weight');
      return;
    }
    if (!user) return;
    getDocs(collection(db, 'users', user.uid, 'customExercises')).then(snap => {
      setCustomExercises(snap.docs.map(d => ({
        id: d.id,
        name: d.data().name as string,
        category: d.data().category as ExerciseCategory,
        type: d.data().type as ExerciseType,
        isCustom: true,
      })));
    }).catch(() => {
      // Silently ignore — user just won't see custom exercises if fetch fails
    });
  }, [open, user]);

  const allExercises = [...STATIC_EXERCISES, ...customExercises];
  const filtered = allExercises.filter(e => {
    if (excludeIds.includes(e.id)) return false;
    if (category !== 'Alla' && e.category !== category) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleCreateCustom() {
    if (!newName.trim() || !user || saving) return;
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'customExercises'), {
        name: newName.trim(),
        category: newCategory,
        type: newType,
        createdAt: Timestamp.now(),
      });
      const created: WorkoutExercise = {
        id: ref.id,
        name: newName.trim(),
        category: newCategory,
        type: newType,
        isCustom: true,
      };
      onSelect(created);
      onClose();
      setShowCreateForm(false);
      setNewName('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Välj övning">
      <div className="space-y-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Sök övning..."
          className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
        />
        <div className="flex gap-2 flex-wrap">
          {(['Alla', ...EXERCISE_CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === cat ? 'bg-earth text-cream' : 'bg-sky text-earth'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="divide-y divide-cream-dark">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => { onSelect(ex); onClose(); }}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <span className="text-sm text-earth">{ex.name}</span>
              <span className="text-xs text-earth-light">{TYPE_LABEL[ex.type]}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-earth-light py-4 text-center">Inga övningar hittades.</p>
          )}
        </div>
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full text-sm text-earth-light py-2 border-t border-cream-dark text-left"
          >
            + Skapa egen övning
          </button>
        ) : (
          <div className="space-y-2 pt-2 border-t border-cream-dark">
            <p className="text-xs font-semibold text-earth">Ny övning</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Namn"
              className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as ExerciseCategory)}
              className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
            >
              {EXERCISE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as ExerciseType)}
              className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
            >
              <option value="free_weight">Fri vikt</option>
              <option value="machine">Maskin</option>
              <option value="bodyweight">Kroppsvikt</option>
            </select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowCreateForm(false); setNewName(''); }}>Avbryt</Button>
              <Button size="sm" onClick={handleCreateCustom} disabled={!newName.trim() || saving}>
                {saving ? 'Sparar...' : 'Skapa'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
