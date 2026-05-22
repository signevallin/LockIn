# Apple Health Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import steps, total calories (active + resting), and workout minutes from Apple Health via an Apple Shortcut that POSTs to a Next.js API route, storing data in Firestore, and display it as chips on the home page and a full Hälsa tab in Stats.

**Architecture:** Two Next.js API routes (`/api/health/sync` and `/api/health/token`) authenticate via Firebase Admin SDK — sync uses a user-specific UUID token, token generation uses a Firebase ID token. Client-side hooks subscribe to Firestore with `onSnapshot`. The home page shows two compact progress chips; Stats gets a Fokus/Hälsa toggle with the full Hälsa view showing today's metrics and a 7-day steps chart.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4 (tokens: `bg-sky`, `bg-cream`, `bg-earth`, `text-earth`, `text-earth-light`, `border-sage`, `bg-cream-dark`), Firebase Firestore (client + Admin SDK), Jest.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `lib/types.ts` | Add `HealthData`, `HealthGoals` types |
| Modify | `lib/firebase/admin.ts` | Export `getAdminDb` (admin Firestore instance) |
| Create | `lib/health/shortcut.ts` | iCloud Shortcut URL constant |
| Create | `app/api/health/sync/route.ts` | Receive health data from Shortcut (token auth) |
| Create | `app/api/health/token/route.ts` | Generate sync token (Firebase ID token auth) |
| Create | `__tests__/api/health-sync.test.ts` | Unit tests for sync route |
| Create | `lib/hooks/useHealthGoals.ts` | Subscribe to `health_goals`, expose `saveGoals` + `generateToken` |
| Create | `lib/hooks/useHealthData.ts` | Subscribe to `health_data/{date}` |
| Create | `lib/hooks/useHealthWeek.ts` | One-shot fetch of last 7 days of health data |
| Create | `components/health/GoalEditor.tsx` | Modal: edit daily step/calorie goals |
| Create | `components/health/HealthChips.tsx` | Home page: 2 chips (steps + calories) with progress |
| Create | `components/health/HealthSetup.tsx` | Stats → Hälsa: token setup flow |
| Create | `components/health/HealthStats.tsx` | Stats → Hälsa: today's metrics + weekly chart |
| Modify | `app/(app)/app/page.tsx` | Add `<HealthChips />` after the quote block |
| Modify | `app/(app)/app/progress/page.tsx` | Add Fokus/Hälsa main toggle |

---

## Task 1: Add HealthData and HealthGoals Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Append the two new types at the end of `lib/types.ts`**

```typescript
export interface HealthData {
  steps: number;
  totalCalories: number;      // active + resting kcal
  workoutMinutes: number;
  syncedAt: Date;
}

export interface HealthGoals {
  dailySteps: number;
  dailyCalories: number;
  healthSyncToken?: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/signevallin/Desktop/LockIn && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(health): add HealthData and HealthGoals types"
```

---

## Task 2: Extend Firebase Admin + Shortcut Constant

**Files:**
- Modify: `lib/firebase/admin.ts`
- Create: `lib/health/shortcut.ts`

- [ ] **Step 1: Read the current `lib/firebase/admin.ts`**

Read the file and understand the current `getAdminAuth` pattern before changing it.

- [ ] **Step 2: Rewrite `lib/firebase/admin.ts` to add `getAdminDb`**

Replace the entire file with:

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function ensureApp(): void {
  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
    initializeApp({ credential: cert(JSON.parse(key)) });
  }
}

let _auth: Auth | null = null;
function getAdminAuth(): Auth {
  if (_auth) return _auth;
  ensureApp();
  _auth = getAuth();
  return _auth;
}

let _db: Firestore | null = null;
export function getAdminDb(): Firestore {
  if (_db) return _db;
  ensureApp();
  _db = getFirestore();
  return _db;
}

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
};
```

- [ ] **Step 3: Create `lib/health/shortcut.ts`**

Create the directory if needed: `mkdir -p lib/health`

```typescript
// Replace this placeholder with the real iCloud Shortcut link once the Shortcut
// has been built in Apple's Shortcuts app and shared via iCloud.
export const SHORTCUT_URL = 'https://www.icloud.com/shortcuts/PLACEHOLDER';
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/firebase/admin.ts lib/health/shortcut.ts
git commit -m "feat(health): add getAdminDb to admin.ts and shortcut URL constant"
```

---

## Task 3: Health API Routes + Tests

**Files:**
- Create: `app/api/health/sync/route.ts`
- Create: `app/api/health/token/route.ts`
- Create: `__tests__/api/health-sync.test.ts`

- [ ] **Step 1: Write the failing test for the sync route**

Create `__tests__/api/health-sync.test.ts`:

```typescript
const mockTokenGet = jest.fn();
const mockDataSet = jest.fn();

jest.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    collection: (_name: string) => ({
      doc: (_id: string) => ({
        get: mockTokenGet,
        collection: (_sub: string) => ({
          doc: (_docId: string) => ({
            set: mockDataSet,
          }),
        }),
      }),
    }),
  }),
}));

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'mock-timestamp' },
}));

// Import AFTER mocks are set up
import { POST } from '@/app/api/health/sync/route';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/health/sync', () => {
  it('returns 400 when token is missing', async () => {
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ steps: 100, totalCalories: 2000, workoutMinutes: 30, date: '2026-05-17' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/token/i);
  });

  it('returns 400 when metrics are missing', async () => {
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc', date: '2026-05-17' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when date is invalid', async () => {
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc', steps: 100, totalCalories: 2000, workoutMinutes: 30, date: 'not-a-date' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when token is not found in Firestore', async () => {
    mockTokenGet.mockResolvedValueOnce({ exists: false });
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ token: 'bad-token', steps: 100, totalCalories: 2000, workoutMinutes: 30, date: '2026-05-17' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 and writes data when token is valid', async () => {
    mockTokenGet.mockResolvedValueOnce({ exists: true, data: () => ({ uid: 'user123' }) });
    mockDataSet.mockResolvedValueOnce(undefined);
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', steps: 8432, totalCalories: 2140, workoutMinutes: 38, date: '2026-05-17' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockDataSet).toHaveBeenCalledWith({
      steps: 8432,
      totalCalories: 2140,
      workoutMinutes: 38,
      syncedAt: 'mock-timestamp',
    });
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
npx jest __tests__/api/health-sync.test.ts --no-coverage 2>&1 | tail -10
```

Expected: FAIL — "Cannot find module '@/app/api/health/sync/route'"

- [ ] **Step 3: Create `app/api/health/sync/route.ts`**

Create directory: `mkdir -p "app/api/health/sync"`

```typescript
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token, steps, totalCalories, workoutMinutes, date } = body as {
    token?: string;
    steps?: number;
    totalCalories?: number;
    workoutMinutes?: number;
    date?: string;
  };

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  if (
    typeof steps !== 'number' ||
    typeof totalCalories !== 'number' ||
    typeof workoutMinutes !== 'number'
  ) {
    return NextResponse.json({ error: 'Missing health metrics' }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const db = getAdminDb();
  const tokenDoc = await db.collection('healthSyncTokens').doc(token).get();
  if (!tokenDoc.exists) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const uid = (tokenDoc.data() as { uid: string }).uid;
  await db
    .collection('users')
    .doc(uid)
    .collection('health_data')
    .doc(date)
    .set({ steps, totalCalories, workoutMinutes, syncedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run the sync tests — expect them to pass**

```bash
npx jest __tests__/api/health-sync.test.ts --no-coverage 2>&1 | tail -10
```

Expected: PASS — 5/5 tests green.

- [ ] **Step 5: Create `app/api/health/token/route.ts`**

Create directory: `mkdir -p "app/api/health/token"`

```typescript
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }

  const token = crypto.randomUUID();
  const db = getAdminDb();

  await db.collection('healthSyncTokens').doc(token).set({
    uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  await db
    .collection('users')
    .doc(uid)
    .collection('health_goals')
    .doc('goals')
    .set({ healthSyncToken: token }, { merge: true });

  return NextResponse.json({ token });
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7: Run all tests**

```bash
npx jest --no-coverage 2>&1 | tail -10
```

Expected: all tests pass including the 5 new sync route tests.

- [ ] **Step 8: Commit**

```bash
git add app/api/health/sync/route.ts app/api/health/token/route.ts __tests__/api/health-sync.test.ts
git commit -m "feat(health): add /api/health/sync and /api/health/token routes with tests"
```

---

## Task 4: useHealthGoals Hook

**Files:**
- Create: `lib/hooks/useHealthGoals.ts`

- [ ] **Step 1: Create `lib/hooks/useHealthGoals.ts`**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { HealthGoals } from '@/lib/types';

export function useHealthGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<HealthGoals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'health_goals', 'goals');
    return onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setGoals({
          dailySteps: (data.dailySteps as number) ?? 10000,
          dailyCalories: (data.dailyCalories as number) ?? 2500,
          healthSyncToken: data.healthSyncToken as string | undefined,
        });
      } else {
        setGoals(null);
      }
      setLoading(false);
    });
  }, [user]);

  async function saveGoals(dailySteps: number, dailyCalories: number) {
    if (!user) return;
    await setDoc(
      doc(db, 'users', user.uid, 'health_goals', 'goals'),
      { dailySteps, dailyCalories },
      { merge: true },
    );
  }

  async function generateToken(): Promise<string | null> {
    if (!user) return null;
    const idToken = await user.getIdToken();
    const res = await fetch('/api/health/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) throw new Error('Failed to generate token');
    const { token } = await res.json() as { token: string };
    return token;
  }

  return { goals, loading, saveGoals, generateToken };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/useHealthGoals.ts
git commit -m "feat(health): add useHealthGoals hook"
```

---

## Task 5: useHealthData + useHealthWeek Hooks

**Files:**
- Create: `lib/hooks/useHealthData.ts`
- Create: `lib/hooks/useHealthWeek.ts`

- [ ] **Step 1: Create `lib/hooks/useHealthData.ts`**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { HealthData } from '@/lib/types';

function toHealthData(data: Record<string, unknown>): HealthData {
  return {
    steps: (data.steps as number) ?? 0,
    totalCalories: (data.totalCalories as number) ?? 0,
    workoutMinutes: (data.workoutMinutes as number) ?? 0,
    syncedAt: data.syncedAt
      ? (data.syncedAt as Timestamp).toDate()
      : new Date(),
  };
}

export function useHealthData(date: string) {
  const { user } = useAuth();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'health_data', date);
    return onSnapshot(ref, snap => {
      setData(snap.exists() ? toHealthData(snap.data() as Record<string, unknown>) : null);
      setLoading(false);
    });
  }, [user, date]);

  return { data, loading };
}
```

- [ ] **Step 2: Create `lib/hooks/useHealthWeek.ts`**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { HealthData } from '@/lib/types';

function getPastDates(count: number): string[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i)); // oldest first
    return d.toISOString().split('T')[0];
  });
}

function toHealthData(data: Record<string, unknown>): HealthData {
  return {
    steps: (data.steps as number) ?? 0,
    totalCalories: (data.totalCalories as number) ?? 0,
    workoutMinutes: (data.workoutMinutes as number) ?? 0,
    syncedAt: data.syncedAt
      ? (data.syncedAt as Timestamp).toDate()
      : new Date(),
  };
}

export function useHealthWeek() {
  const { user } = useAuth();
  const [days, setDays] = useState<{ date: string; data: HealthData | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    const dates = getPastDates(7);
    Promise.all(
      dates.map(date =>
        getDoc(doc(db, 'users', user.uid, 'health_data', date)).then(snap => ({
          date,
          data: snap.exists()
            ? toHealthData(snap.data() as Record<string, unknown>)
            : null,
        })),
      ),
    ).then(setDays);
  }, [user]);

  return { days };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useHealthData.ts lib/hooks/useHealthWeek.ts
git commit -m "feat(health): add useHealthData and useHealthWeek hooks"
```

---

## Task 6: GoalEditor Component

**Files:**
- Create: `components/health/GoalEditor.tsx`

Read `components/ui/Modal.tsx` and `components/ui/Button.tsx` before implementing to verify the exact props they accept.

- [ ] **Step 1: Create `components/health/GoalEditor.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/health/GoalEditor.tsx
git commit -m "feat(health): add GoalEditor modal component"
```

---

## Task 7: HealthChips Component

**Files:**
- Create: `components/health/HealthChips.tsx`

- [ ] **Step 1: Create `components/health/HealthChips.tsx`**

```tsx
'use client';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { useHealthData } from '@/lib/hooks/useHealthData';

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(value / max, 1) * 100;
  return (
    <div className="bg-cream-dark rounded-full h-1 mt-1.5 overflow-hidden">
      <div className="bg-earth h-full rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function HealthChips() {
  const { goals } = useHealthGoals();
  const { data } = useHealthData(todayDate());

  // Only render once the user has set up the Shortcut integration
  if (!goals?.healthSyncToken) return null;

  const steps = data?.steps ?? null;
  const calories = data?.totalCalories ?? null;

  return (
    <div className="flex gap-3">
      <div className="flex-1 bg-sky rounded-2xl p-3 text-center">
        <p className="text-base font-bold text-earth">
          {steps !== null ? steps.toLocaleString('sv-SE') : '—'}
        </p>
        <p className="text-xs text-earth-light">
          👟 steg / {goals.dailySteps.toLocaleString('sv-SE')}
        </p>
        {steps !== null && <ProgressBar value={steps} max={goals.dailySteps} />}
      </div>
      <div className="flex-1 bg-sky rounded-2xl p-3 text-center">
        <p className="text-base font-bold text-earth">
          {calories !== null ? calories.toLocaleString('sv-SE') : '—'}
        </p>
        <p className="text-xs text-earth-light">
          🔥 kcal / {goals.dailyCalories.toLocaleString('sv-SE')}
        </p>
        {calories !== null && <ProgressBar value={calories} max={goals.dailyCalories} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/health/HealthChips.tsx
git commit -m "feat(health): add HealthChips component for home page"
```

---

## Task 8: HealthSetup Component

**Files:**
- Create: `components/health/HealthSetup.tsx`

- [ ] **Step 1: Create `components/health/HealthSetup.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { SHORTCUT_URL } from '@/lib/health/shortcut';

export function HealthSetup() {
  const { goals, generateToken } = useHealthGoals();
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [testing, setTesting] = useState(false);

  const token = goals?.healthSyncToken;

  async function handleActivate() {
    setGenerating(true);
    setGenerateError('');
    try {
      await generateToken();
    } catch {
      setGenerateError('Kunde inte generera token. Försök igen.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleTest() {
    if (!token) return;
    setTesting(true);
    setTestStatus('idle');
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/health/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          steps: 0,
          totalCalories: 0,
          workoutMinutes: 0,
          date: today,
        }),
      });
      setTestStatus(res.ok ? 'ok' : 'error');
    } catch {
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="bg-sky rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-bold text-earth text-base mb-1">Koppla Apple Health</h2>
        <p className="text-xs text-earth-light">
          Synka steg, kalorier och träningsminuter automatiskt via ett Apple Shortcut
          som körs kl 08:00, 12:00 och 20:00.
        </p>
      </div>

      {!token ? (
        <>
          <button
            onClick={handleActivate}
            disabled={generating}
            className="w-full bg-earth text-cream py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {generating ? 'Genererar token...' : 'Aktivera'}
          </button>
          {generateError && (
            <p className="text-sm text-red-500 text-center">{generateError}</p>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-earth-light mb-1">Din synk-token</p>
            <div className="bg-white rounded-xl border border-sage px-3 py-2 font-mono text-xs text-earth break-all select-all">
              {token}
            </div>
          </div>

          <ol className="space-y-3">
            <li className="flex gap-3 items-start">
              <span className="bg-earth text-cream rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="text-sm text-earth font-medium">Hämta Shortcutet</p>
                <a
                  href={SHORTCUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-earth-light underline"
                >
                  Öppna i Shortcuts-appen →
                </a>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="bg-earth text-cream rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </span>
              <p className="text-sm text-earth">
                Klistra in din token när du installerar Shortcutet
              </p>
            </li>
            <li className="flex gap-3 items-start">
              <span className="bg-earth text-cream rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </span>
              <p className="text-sm text-earth">
                Öppna <strong>Shortcuts → Automatisering</strong> och skapa tre
                tidbaserade automationer: <strong>08:00, 12:00 och 20:00</strong> som
                kör Shortcutet
              </p>
            </li>
          </ol>

          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full border border-sage text-earth py-2.5 rounded-xl text-sm disabled:opacity-50"
          >
            {testing ? 'Testar...' : 'Testa synk'}
          </button>
          {testStatus === 'ok' && (
            <p className="text-sm text-green-600 text-center">✅ Koppling fungerar!</p>
          )}
          {testStatus === 'error' && (
            <p className="text-sm text-red-500 text-center">
              ❌ Något gick fel — kontrollera din token
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/health/HealthSetup.tsx
git commit -m "feat(health): add HealthSetup component with token generation and instructions"
```

---

## Task 9: HealthStats Component

**Files:**
- Create: `components/health/HealthStats.tsx`

First, read `components/progress/ActivityChart.tsx` to confirm the exact props it accepts (`data: { label: string, value: number, isToday: boolean }[]`).

- [ ] **Step 1: Read `components/progress/ActivityChart.tsx`**

Confirm the component signature and the shape of the `data` prop before proceeding.

- [ ] **Step 2: Create `components/health/HealthStats.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { useHealthData } from '@/lib/hooks/useHealthData';
import { useHealthWeek } from '@/lib/hooks/useHealthWeek';
import { GoalEditor } from './GoalEditor';
import { ActivityChart } from '@/components/progress/ActivityChart';

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Short Swedish weekday labels Mon–Sun (Mon = index 0)
const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(value / max, 1) * 100;
  return (
    <div className="bg-cream-dark rounded-full h-1.5 mt-1.5 overflow-hidden">
      <div className="bg-earth h-full rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function HealthStats() {
  const { goals, saveGoals } = useHealthGoals();
  const today = todayDate();
  const { data } = useHealthData(today);
  const { days } = useHealthWeek();
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);

  // Build chart data: one entry per day, oldest→newest, matching ActivityChart's prop shape
  const chartData = days.map(d => {
    // Parse date as noon local time to avoid timezone-shift day flips
    const date = new Date(d.date + 'T12:00:00');
    const dayIdx = (date.getDay() + 6) % 7; // getDay(): 0=Sun → Mon=1 becomes 0
    return {
      label: DAY_LABELS[dayIdx],
      value: d.data?.steps ?? 0,
      isToday: d.date === today,
    };
  });

  const syncLabel = data?.syncedAt
    ? `Senast synkat: ${data.syncedAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`
    : 'Aldrig synkat';

  return (
    <>
      <div className="space-y-3">
        {/* Today's numbers */}
        <div className="bg-sky rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-earth-light mb-3">Idag</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-earth">
                {data ? data.steps.toLocaleString('sv-SE') : '—'}
              </p>
              <p className="text-xs text-earth-light">👟 steg</p>
              {data && goals && (
                <>
                  <ProgressBar value={data.steps} max={goals.dailySteps} />
                  <p className="text-xs text-earth-light mt-1">
                    / {goals.dailySteps.toLocaleString('sv-SE')}
                  </p>
                </>
              )}
            </div>
            <div>
              <p className="text-xl font-bold text-earth">
                {data ? data.totalCalories.toLocaleString('sv-SE') : '—'}
              </p>
              <p className="text-xs text-earth-light">🔥 kcal</p>
              {data && goals && (
                <>
                  <ProgressBar value={data.totalCalories} max={goals.dailyCalories} />
                  <p className="text-xs text-earth-light mt-1">
                    / {goals.dailyCalories.toLocaleString('sv-SE')}
                  </p>
                </>
              )}
            </div>
            <div>
              <p className="text-xl font-bold text-earth">
                {data ? data.workoutMinutes : '—'}
              </p>
              <p className="text-xs text-earth-light">💪 träningsmin</p>
            </div>
          </div>
        </div>

        {/* Weekly steps chart — reuses ActivityChart from the Fokus tab */}
        {chartData.length > 0 && (
          <div className="bg-sky rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest text-earth-light mb-3">
              Steg · 7 dagar
            </p>
            <ActivityChart data={chartData} />
          </div>
        )}

        {/* Goals row */}
        <div className="bg-sky rounded-2xl p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-earth font-medium truncate">
              Mål: {goals?.dailySteps?.toLocaleString('sv-SE') ?? '—'} steg ·{' '}
              {goals?.dailyCalories?.toLocaleString('sv-SE') ?? '—'} kcal
            </p>
            <p className="text-xs text-earth-light">{syncLabel}</p>
          </div>
          <button
            onClick={() => setGoalEditorOpen(true)}
            className="text-xs text-earth border border-sage bg-white px-3 py-1.5 rounded-lg flex-shrink-0"
          >
            Ändra mål
          </button>
        </div>
      </div>

      <GoalEditor
        open={goalEditorOpen}
        onClose={() => setGoalEditorOpen(false)}
        current={goals}
        onSave={saveGoals}
      />
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/health/HealthStats.tsx
git commit -m "feat(health): add HealthStats component with today metrics and weekly chart"
```

---

## Task 10: Wire HealthChips into Home Page

**Files:**
- Modify: `app/(app)/app/page.tsx`

- [ ] **Step 1: Read `app/(app)/app/page.tsx`**

Read the full file to find the exact location of the `{/* Progress */}` comment block.

- [ ] **Step 2: Add the `HealthChips` import**

At the top of the file, add the import alongside the other component imports:

```typescript
import { HealthChips } from '@/components/health/HealthChips';
```

- [ ] **Step 3: Insert `<HealthChips />` after the quote block**

Find this block in the JSX (it appears right after the Dagligt citat div):

```tsx
      {/* Progress */}
      <ProgressSummary
```

Insert `<HealthChips />` immediately before it:

```tsx
      {/* Apple Health */}
      <HealthChips />

      {/* Progress */}
      <ProgressSummary
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/app/page.tsx"
git commit -m "feat(health): add HealthChips to home page"
```

---

## Task 11: Wire HealthStats/HealthSetup into Progress Page

**Files:**
- Modify: `app/(app)/app/progress/page.tsx`

- [ ] **Step 1: Read `app/(app)/app/progress/page.tsx`**

Read the full file before making changes.

- [ ] **Step 2: Replace the full content of `app/(app)/app/progress/page.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useFocusSessions } from '@/lib/hooks/useFocusSessions';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { ActivityChart } from '@/components/progress/ActivityChart';
import { HealthStats } from '@/components/health/HealthStats';
import { HealthSetup } from '@/components/health/HealthSetup';

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export default function ProgressPage() {
  const { sessions, todayMinutes, loading } = useFocusSessions();
  const { goals } = useHealthGoals();
  const [period, setPeriod] = useState<'vecka' | 'månad'>('vecka');
  const [activeTab, setActiveTab] = useState<'fokus' | 'hälsa'>('fokus');

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-earth pt-2">Min progress</h1>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-sky rounded-2xl p-3 shadow-sm border border-cream-dark h-14 animate-pulse" />
          ))}
        </div>
        <div className="bg-sky rounded-2xl p-4 shadow-sm border border-cream-dark h-32 animate-pulse" />
      </div>
    );
  }

  const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0
  const weekData = DAY_LABELS.map((label, i) => ({
    label,
    value: i === todayIdx ? todayMinutes : 0,
    isToday: i === todayIdx,
  }));

  const totalHours = Math.floor(todayMinutes / 60);
  const totalMins = todayMinutes % 60;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-earth pt-2">Min progress</h1>

      {/* Main Fokus / Hälsa toggle */}
      <div className="flex gap-2">
        {(['fokus', 'hälsa'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-earth text-cream'
                : 'bg-cream-dark text-earth-light'
            }`}
          >
            {tab === 'fokus' ? 'Fokus' : 'Hälsa'}
          </button>
        ))}
      </div>

      {activeTab === 'fokus' ? (
        <>
          {/* Period toggle */}
          <div className="flex gap-2">
            {(['vecka', 'månad'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  period === p
                    ? 'bg-earth text-cream'
                    : 'bg-cream-dark text-earth-light'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Fokus idag', value: `${totalHours}h ${totalMins}m` },
              { label: 'Sessioner', value: sessions.length.toString() },
              { label: 'Streak', value: '—' },
            ].map(stat => (
              <div
                key={stat.label}
                className="bg-sky rounded-2xl p-3 shadow-sm border border-cream-dark text-center"
              >
                <p className="text-lg font-bold text-earth">{stat.value}</p>
                <p className="text-xs text-earth-light">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-sky rounded-2xl p-4 shadow-sm border border-cream-dark">
            <p className="text-xs uppercase tracking-widest text-earth-light mb-3">
              Veckans aktivitet (min)
            </p>
            <ActivityChart data={weekData} />
          </div>
        </>
      ) : goals?.healthSyncToken ? (
        <HealthStats />
      ) : (
        <HealthSetup />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
npx jest --no-coverage 2>&1 | tail -10
```

Expected: all tests pass (27 tests: 22 existing + 5 new sync route tests).

- [ ] **Step 5: Build the project**

Read the Next.js docs first:
```bash
ls node_modules/next/dist/docs/ 2>/dev/null | head -5
```

Then build:
```bash
npm run build 2>&1 | tail -25
```

Expected: build completes with no errors. (A pre-existing `lightningcss` native module warning may appear — that is not caused by this feature.)

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/app/progress/page.tsx"
git commit -m "feat(health): add Fokus/Hälsa toggle to progress page"
```

- [ ] **Step 7: Merge to main and push**

```bash
cd /Users/signevallin/Desktop/LockIn
git merge feature/lockin-build
git push origin main
```

---

## Manual Post-Implementation Step (not automated)

Once the code is deployed, build the Apple Shortcut manually:

1. Open the **Shortcuts** app on your iPhone
2. Create a new Shortcut with these actions:
   - **Get Health Samples** → Type: Steps, Time Period: Today → Save result as `steps`
   - **Get Health Samples** → Type: Active Energy, Time Period: Today → Sum → Save as `activeKcal`
   - **Get Health Samples** → Type: Resting Energy, Time Period: Today → First item → Save as `restingKcal`
   - **Calculate** `activeKcal + restingKcal` → Save as `totalCalories`
   - **Get Health Samples** → Type: Exercise Minutes (or Workout Minutes), Time Period: Today → Save as `workoutMinutes`
   - **Get Current Date** → Format: ISO 8601 date only (`YYYY-MM-DD`) → Save as `date`
   - **Get Contents of URL** → URL: `https://<your-app>.vercel.app/api/health/sync`, Method: POST, Body JSON: `{ "token": "<paste-token>", "steps": steps, "totalCalories": totalCalories, "workoutMinutes": workoutMinutes, "date": date }`
3. Share the Shortcut via iCloud and update `SHORTCUT_URL` in `lib/health/shortcut.ts`
