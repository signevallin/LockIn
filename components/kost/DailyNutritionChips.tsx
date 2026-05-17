'use client';

interface Props {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export function DailyNutritionChips({ kcal, proteinG, fatG, carbsG }: Props) {
  const chips = [
    { value: Math.round(kcal).toLocaleString('sv-SE'), label: 'kcal' },
    { value: `${Math.round(proteinG)}g`, label: 'protein' },
    { value: `${Math.round(fatG)}g`, label: 'fett' },
    { value: `${Math.round(carbsG)}g`, label: 'kolh.' },
  ];

  return (
    <div className="flex gap-2">
      {chips.map(c => (
        <div key={c.label} className="flex-1 bg-sky rounded-2xl p-2 text-center">
          <p className="text-sm font-bold text-earth">{c.value}</p>
          <p className="text-xs text-earth-light">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
