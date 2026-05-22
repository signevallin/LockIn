# AI-baserad matloggning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ersätt Open Food Facts-sökning med ett AI-drivet fritextflöde där användaren beskriver sin måltid och Claude uppskattar makron.

**Architecture:** En ny Next.js API-route (`/api/ai/parse-food`) anropar Claude API server-side och returnerar näringsvärden per 100g. `AddFoodSheet` byggs om till ett tvåstegsflöde: fritext → portionsval. Kost-sidan förenklas genom att ta bort favorites-beroenden.

**Tech Stack:** Next.js 16 App Router, `@anthropic-ai/sdk` (redan installerad), TypeScript, Tailwind CSS v4, Firebase Firestore (oförändrad), Jest + React Testing Library

---

## Filstruktur

| Fil | Åtgärd | Syfte |
|-----|--------|-------|
| `app/api/ai/parse-food/route.ts` | Skapa | POST-route som anropar Claude och returnerar makron/100g |
| `components/kost/AddFoodSheet.tsx` | Skriv om | Byt ut sökning mot fritext + portionsval |
| `app/(app)/app/kost/page.tsx` | Modifiera | Ta bort favorites-props från AddFoodSheet |
| `__tests__/api/parse-food.test.ts` | Skapa | Enhetstester för API-routen |
| `__tests__/components/kost/AddFoodSheet.test.tsx` | Skapa | Komponenttester för nya AddFoodSheet |

---

## Task 1: API-route `/api/ai/parse-food`

**Files:**
- Create: `app/api/ai/parse-food/route.ts`
- Create: `__tests__/api/parse-food.test.ts`

- [ ] **Step 1: Skapa testfil och skriv failing tests**

```typescript
// __tests__/api/parse-food.test.ts
import { POST } from '@/app/api/ai/parse-food/route';

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: 'Kycklingfilé med ris och sallad',
                kcalPer100g: 145,
                proteinPer100gG: 14.2,
                fatPer100gG: 3.1,
                carbsPer100gG: 15.8,
              }),
            },
          ],
        }),
      },
    })),
  };
});

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/ai/parse-food', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/ai/parse-food', () => {
  it('returnerar makron för en giltig beskrivning', async () => {
    const res = await POST(makeRequest({ description: 'kycklingfilé med ris' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('Kycklingfilé med ris och sallad');
    expect(typeof data.kcalPer100g).toBe('number');
    expect(typeof data.proteinPer100gG).toBe('number');
    expect(typeof data.fatPer100gG).toBe('number');
    expect(typeof data.carbsPer100gG).toBe('number');
  });

  it('returnerar 400 om description saknas', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returnerar 400 om description är tom sträng', async () => {
    const res = await POST(makeRequest({ description: '   ' }));
    expect(res.status).toBe(400);
  });

  it('returnerar 400 vid ogiltig JSON', async () => {
    const req = new Request('http://localhost/api/ai/parse-food', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Kör testerna och bekräfta att de failar**

```bash
cd /Users/signevallin/Desktop/LockIn && npx jest __tests__/api/parse-food.test.ts --no-coverage
```

Förväntat: FAIL med "Cannot find module '@/app/api/ai/parse-food/route'"

- [ ] **Step 3: Skapa API-routen**

```typescript
// app/api/ai/parse-food/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export interface ParsedFood {
  name: string;
  kcalPer100g: number;
  proteinPer100gG: number;
  fatPer100gG: number;
  carbsPer100gG: number;
}

const client = new Anthropic();

export async function POST(req: Request) {
  let body: { description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { description } = body;
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return NextResponse.json({ error: 'Missing description' }, { status: 400 });
  }

  let text: string;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Estimera näringsvärden per 100g för följande måltid som en sammanslagen enhet. Svara ENBART med giltig JSON, inga förklaringar.

Måltid: "${description.trim()}"

Svara med:
{
  "name": "Måltidsnamn på svenska",
  "kcalPer100g": <number>,
  "proteinPer100gG": <number>,
  "fatPer100gG": <number>,
  "carbsPer100gG": <number>
}`,
        },
      ],
    });
    text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  } catch {
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }

  let parsed: ParsedFood;
  try {
    parsed = JSON.parse(text) as ParsedFood;
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  if (
    typeof parsed.name !== 'string' ||
    typeof parsed.kcalPer100g !== 'number' ||
    typeof parsed.proteinPer100gG !== 'number' ||
    typeof parsed.fatPer100gG !== 'number' ||
    typeof parsed.carbsPer100gG !== 'number'
  ) {
    return NextResponse.json({ error: 'Invalid AI response shape' }, { status: 500 });
  }

  return NextResponse.json(parsed);
}
```

- [ ] **Step 4: Kör testerna och bekräfta att de passerar**

```bash
npx jest __tests__/api/parse-food.test.ts --no-coverage
```

Förväntat: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/ai/parse-food/route.ts __tests__/api/parse-food.test.ts
git commit -m "feat: add AI parse-food API route"
```

---

## Task 2: Skriv om AddFoodSheet

**Files:**
- Modify: `components/kost/AddFoodSheet.tsx`
- Create: `__tests__/components/kost/AddFoodSheet.test.tsx`

- [ ] **Step 1: Skriv komponenttester**

```typescript
// __tests__/components/kost/AddFoodSheet.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddFoodSheet } from '@/components/kost/AddFoodSheet';

// Mock Modal to render children directly
jest.mock('@/components/ui/Modal', () => ({
  Modal: ({ open, children, title }: { open: boolean; children: React.ReactNode; title: string }) =>
    open ? <div><h2>{title}</h2>{children}</div> : null,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const defaultProps = {
  open: true,
  mealLabel: 'Lunch',
  onAdd: jest.fn(),
  onClose: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AddFoodSheet', () => {
  it('visar texttextfält när sheetet öppnas', () => {
    render(<AddFoodSheet {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Vad åt du/)).toBeInTheDocument();
    expect(screen.getByText('Analysera')).toBeInTheDocument();
  });

  it('Analysera-knappen är inaktiverad när fältet är tomt', () => {
    render(<AddFoodSheet {...defaultProps} />);
    expect(screen.getByText('Analysera')).toBeDisabled();
  });

  it('Analysera-knappen aktiveras när text skrivs in', () => {
    render(<AddFoodSheet {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Vad åt du/), {
      target: { value: 'kycklingfilé' },
    });
    expect(screen.getByText('Analysera')).not.toBeDisabled();
  });

  it('visar portionssteg efter lyckat API-anrop', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: 'Kycklingfilé',
        kcalPer100g: 165,
        proteinPer100gG: 31,
        fatPer100gG: 3.6,
        carbsPer100gG: 0,
      }),
    });

    render(<AddFoodSheet {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Vad åt du/), {
      target: { value: 'kycklingfilé' },
    });
    fireEvent.click(screen.getByText('Analysera'));

    await waitFor(() => {
      expect(screen.getByText('Kycklingfilé')).toBeInTheDocument();
    });

    expect(screen.getByText('Liten')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Stor')).toBeInTheDocument();
  });

  it('visar felmeddelande om API-anropet misslyckas', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    render(<AddFoodSheet {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Vad åt du/), {
      target: { value: 'kycklingfilé' },
    });
    fireEvent.click(screen.getByText('Analysera'));

    await waitFor(() => {
      expect(screen.getByText(/Kunde inte tolka/)).toBeInTheDocument();
    });
  });

  it('anropar onAdd med korrekt FoodItem vid Lägg till', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: 'Kycklingfilé',
        kcalPer100g: 165,
        proteinPer100gG: 31,
        fatPer100gG: 3.6,
        carbsPer100gG: 0,
      }),
    });

    const onAdd = jest.fn();
    render(<AddFoodSheet {...defaultProps} onAdd={onAdd} />);
    fireEvent.change(screen.getByPlaceholderText(/Vad åt du/), {
      target: { value: 'kycklingfilé' },
    });
    fireEvent.click(screen.getByText('Analysera'));

    await waitFor(() => screen.getByText('Kycklingfilé'));

    // Normal = 300g
    fireEvent.click(screen.getByText('Normal'));
    fireEvent.click(screen.getByText('Lägg till'));

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Kycklingfilé',
      weightG: 300,
      kcal: 495,         // 165 * 3
      proteinG: 93,      // 31 * 3
      fatG: 10.8,        // 3.6 * 3
      carbsG: 0,
    });
  });
});
```

- [ ] **Step 2: Kör testerna och bekräfta att de failar**

```bash
npx jest __tests__/components/kost/AddFoodSheet.test.tsx --no-coverage
```

Förväntat: FAIL — testerna hittar fel props-interface eller gamla element

- [ ] **Step 3: Skriv om AddFoodSheet**

```typescript
// components/kost/AddFoodSheet.tsx
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
```

- [ ] **Step 4: Kör testerna och bekräfta att de passerar**

```bash
npx jest __tests__/components/kost/AddFoodSheet.test.tsx --no-coverage
```

Förväntat: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/kost/AddFoodSheet.tsx __tests__/components/kost/AddFoodSheet.test.tsx
git commit -m "feat: rewrite AddFoodSheet with AI free-text flow"
```

---

## Task 3: Uppdatera Kost-sidan

**Files:**
- Modify: `app/(app)/app/kost/page.tsx`

- [ ] **Step 1: Ersätt hela filen**

```typescript
// app/(app)/app/kost/page.tsx
'use client';
import { useState } from 'react';
import { useFoodLog } from '@/lib/hooks/useFoodLog';
import type { MealKey } from '@/lib/hooks/useFoodLog';
import { DailyNutritionChips } from '@/components/kost/DailyNutritionChips';
import { MealSection } from '@/components/kost/MealSection';
import { AddFoodSheet } from '@/components/kost/AddFoodSheet';
import type { FoodItem } from '@/lib/types';

const MEALS: { key: MealKey; label: string; emoji: string }[] = [
  { key: 'frukost', label: 'Frukost', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'middag', label: 'Middag', emoji: '🌙' },
  { key: 'mellanmal', label: 'Mellanmål', emoji: '🍎' },
];

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function KostPage() {
  const today = todayDate();
  const { log, totals, addItem, removeItem } = useFoodLog(today);
  const [addingTo, setAddingTo] = useState<MealKey | null>(null);

  const activeMeal = MEALS.find(m => m.key === addingTo);

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold text-earth pt-2">Kost · idag</h1>

      <DailyNutritionChips
        kcal={totals.kcal}
        proteinG={totals.proteinG}
        fatG={totals.fatG}
        carbsG={totals.carbsG}
      />

      {MEALS.map(({ key, label, emoji }) => (
        <MealSection
          key={key}
          title={label}
          emoji={emoji}
          items={log.meals[key]}
          onAdd={() => setAddingTo(key)}
          onRemove={i => removeItem(key, i)}
        />
      ))}

      {activeMeal && (
        <AddFoodSheet
          open={addingTo !== null}
          mealLabel={activeMeal.label}
          onAdd={(item: FoodItem) => {
            if (addingTo) addItem(addingTo, item);
          }}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Kör alla tester**

```bash
npx jest --no-coverage
```

Förväntat: Alla befintliga tester PASS, inga TypeScript-fel

- [ ] **Step 3: Commit och push**

```bash
git add app/\(app\)/app/kost/page.tsx
git commit -m "feat: simplify KostPage — remove favorites from AddFoodSheet"
git push origin main
```

---

## Spec-täckningskoll (self-review)

- ✅ Fritextinput med "Vad åt du?" — Task 2
- ✅ Claude API anropas server-side — Task 1
- ✅ Portionsknappar Liten/Normal/Stor + gram-input — Task 2
- ✅ Måltidskategorier behålls (mealLabel-prop) — Task 2 & 3
- ✅ Felhantering med "Kunde inte tolka" — Task 2
- ✅ Laddningstillstånd "Analyserar..." — Task 2
- ✅ Firestore-struktur oförändrad — inga ändringar i useFoodLog
- ✅ ANTHROPIC_API_KEY via miljövariabel — Task 1 (Anthropic SDK hämtar automatiskt från env)
