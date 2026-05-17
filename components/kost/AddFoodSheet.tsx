'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { searchFoods } from '@/lib/api/openFoodFacts';
import type { OpenFoodProduct } from '@/lib/api/openFoodFacts';
import type { FoodFavorite, FoodItem } from '@/lib/types';

interface Props {
  open: boolean;
  mealLabel: string;
  favorites: FoodFavorite[];
  onAdd: (item: FoodItem) => void;
  onSaveFavorite: (fav: Omit<FoodFavorite, 'id' | 'lastUsedAt'>) => void;
  onClose: () => void;
}

function calcItem(product: OpenFoodProduct, weightG: number): FoodItem {
  const ratio = weightG / 100;
  return {
    name: product.name,
    weightG,
    kcal: Math.round(product.kcalPer100g * ratio),
    proteinG: Math.round(product.proteinPer100gG * ratio * 10) / 10,
    fatG: Math.round(product.fatPer100gG * ratio * 10) / 10,
    carbsG: Math.round(product.carbsPer100gG * ratio * 10) / 10,
  };
}

export function AddFoodSheet({ open, mealLabel, favorites, onAdd, onSaveFavorite, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenFoodProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OpenFoodProduct | null>(null);
  const [weight, setWeight] = useState('100');
  const [saveAsFav, setSaveAsFav] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      searchFoods(query.trim())
        .then(setResults)
        .catch(() => setSearchError('Kunde inte hämta sökresultat'))
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setWeight('100');
      setSaveAsFav(false);
      setSearchError(null);
    }
  }, [open]);

  function handleAdd() {
    if (!selected) return;
    const w = parseInt(weight, 10);
    if (isNaN(w) || w <= 0) return;
    onAdd(calcItem(selected, w));
    if (saveAsFav) {
      onSaveFavorite({
        name: selected.name,
        kcalPer100g: selected.kcalPer100g,
        proteinPer100gG: selected.proteinPer100gG,
        fatPer100gG: selected.fatPer100gG,
        carbsPer100gG: selected.carbsPer100gG,
      });
    }
    onClose();
  }

  function selectFavorite(fav: FoodFavorite) {
    setSelected({
      name: fav.name,
      kcalPer100g: fav.kcalPer100g,
      proteinPer100gG: fav.proteinPer100gG,
      fatPer100gG: fav.fatPer100gG,
      carbsPer100gG: fav.carbsPer100gG,
    });
    setWeight('100');
  }

  const parsedWeight = parseInt(weight, 10);
  const preview = selected && !isNaN(parsedWeight) && parsedWeight > 0
    ? calcItem(selected, parsedWeight)
    : null;

  return (
    <Modal open={open} onClose={onClose} title={`Lägg till · ${mealLabel}`}>
      {selected ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-earth">{selected.name}</p>
          <p className="text-xs text-earth-light">
            {selected.kcalPer100g} kcal/100g · P:{selected.proteinPer100gG}g · F:{selected.fatPer100gG}g · K:{selected.carbsPer100gG}g
          </p>

          <div>
            <label className="text-xs text-earth-light block mb-1">Vikt (gram)</label>
            <input
              type="number"
              inputMode="numeric"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              min="1"
              className="w-full bg-sky border border-cream-dark rounded-xl px-3 py-2 text-sm text-earth"
            />
          </div>

          {preview && (
            <p className="text-xs text-earth-light">
              {preview.kcal} kcal · P:{preview.proteinG}g · F:{preview.fatG}g · K:{preview.carbsG}g
            </p>
          )}

          <label className="flex items-center gap-2 text-xs text-earth cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsFav}
              onChange={e => setSaveAsFav(e.target.checked)}
            />
            Spara som favorit
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setSelected(null)}
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
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="🔍 Sök livsmedel..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-sky border border-cream-dark rounded-xl px-3 py-2 text-sm text-earth"
          />

          {favorites.length > 0 && query.trim().length < 2 && (
            <div>
              <p className="text-xs font-semibold text-earth-light uppercase tracking-wider mb-2">
                Mina favoriter
              </p>
              <div className="space-y-1">
                {favorites.slice(0, 5).map(fav => (
                  <button
                    key={fav.id}
                    onClick={() => selectFavorite(fav)}
                    className="w-full text-left bg-cream-dark rounded-xl px-3 py-2"
                  >
                    <p className="text-xs font-semibold text-earth">{fav.name}</p>
                    <p className="text-xs text-earth-light">
                      {fav.kcalPer100g} kcal/100g · P:{fav.proteinPer100gG}g · F:{fav.fatPer100gG}g · K:{fav.carbsPer100gG}g
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searching && (
            <p className="text-xs text-earth-light text-center py-2">Söker...</p>
          )}

          {searchError && (
            <div className="text-center">
              <p className="text-xs text-earth-light">{searchError}</p>
              <button
                onClick={() => {
                  setSearchError(null);
                  setSearching(true);
                  searchFoods(query.trim())
                    .then(setResults)
                    .catch(() => setSearchError('Kunde inte hämta sökresultat'))
                    .finally(() => setSearching(false));
                }}
                className="text-xs text-earth underline mt-1"
              >
                Försök igen
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-earth-light uppercase tracking-wider mb-2">
                Sökresultat
              </p>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(r)}
                    className="w-full text-left bg-cream-dark rounded-xl px-3 py-2"
                  >
                    <p className="text-xs font-semibold text-earth">{r.name}</p>
                    <p className="text-xs text-earth-light">
                      {r.kcalPer100g} kcal/100g · P:{r.proteinPer100gG}g · F:{r.fatPer100gG}g · K:{r.carbsPer100gG}g
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && query.trim().length >= 2 && !searching && !searchError && (
            <p className="text-xs text-earth-light text-center py-2">
              Inga resultat — prova att söka på engelska
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
