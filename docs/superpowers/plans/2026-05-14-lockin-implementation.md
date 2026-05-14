# LockIn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build LockIn — en PWA accountability-app med mål, löften med insatser, fokustimer, daglig incheckning, AI-coach och push-notiser.

**Architecture:** Next.js 14 App Router med skyddade `/app/*`-rutter. Firebase hanterar auth och Firestore-data. En Next.js API-route proxar Claude-anrop för AI-coachen, autentiserad via Firebase Admin SDK. Push-notiser via FCM + Firebase Cloud Functions.

**Tech Stack:** Next.js 14 (TypeScript), Tailwind CSS, Firebase v10 (Auth + Firestore + FCM), Firebase Admin SDK, Firebase Cloud Functions, @anthropic-ai/sdk, @ducanh2912/next-pwa

---

## File Map

```
lockin/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                  # Auth guard + bottom nav
│   │   ├── page.tsx                    # Home dashboard
│   │   ├── goals/page.tsx
│   │   ├── promises/page.tsx
│   │   ├── focus/page.tsx
│   │   ├── progress/page.tsx
│   │   ├── coach/page.tsx
│   │   └── profile/page.tsx
│   ├── api/coach/route.ts              # Claude API proxy
│   ├── layout.tsx                      # Root layout
│   └── page.tsx                        # Landing page
├── components/
│   ├── ui/Button.tsx
│   ├── ui/Modal.tsx
│   ├── ui/ProgressRing.tsx
│   ├── home/CheckInModal.tsx
│   ├── home/DailyTasks.tsx
│   ├── home/CoachCard.tsx
│   ├── home/ProgressSummary.tsx
│   ├── goals/GoalCard.tsx
│   ├── goals/GoalForm.tsx
│   ├── promises/PromiseCard.tsx
│   ├── promises/PromiseForm.tsx
│   ├── focus/FocusTimer.tsx
│   ├── progress/ActivityChart.tsx
│   ├── coach/ChatInterface.tsx
│   └── layout/BottomNav.tsx
├── lib/
│   ├── firebase/config.ts
│   ├── firebase/admin.ts
│   ├── firebase/fcm.ts
│   ├── hooks/useAuth.ts
│   ├── hooks/useGoals.ts
│   ├── hooks/useTasks.ts
│   ├── hooks/useCheckIn.ts
│   ├── hooks/usePromises.ts
│   ├── hooks/useFocusSessions.ts
│   ├── utils/streak.ts
│   ├── utils/xp.ts
│   ├── utils/quotes.ts
│   ├── utils/milestones.ts
│   └── types.ts
├── functions/src/index.ts              # Firebase Cloud Functions
├── public/
│   ├── manifest.json
│   └── firebase-messaging-sw.js
├── __tests__/
│   ├── utils/streak.test.ts
│   ├── utils/xp.test.ts
│   └── utils/milestones.test.ts
├── .env.local
├── next.config.js
├── tailwind.config.js
├── jest.config.ts
└── jest.setup.ts
```

---

### Task 1: Project initialization

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.js`, `tsconfig.json`, `jest.config.ts`, `jest.setup.ts`, `.env.local`

- [ ] **Step 1: Scaffold Next.js project**

```bash
npx create-next-app@latest lockin \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd lockin
```

- [ ] **Step 2: Install dependencies**

```bash
npm install firebase firebase-admin @anthropic-ai/sdk @ducanh2912/next-pwa
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest ts-jest
```

- [ ] **Step 3: Configure Jest**

Write `jest.config.ts`:
```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};

export default createJestConfig(config);
```

Write `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Create `.env.local`**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_SERVICE_ACCOUNT_KEY=
ANTHROPIC_API_KEY=
EOF
```

Fyll i värdena från Firebase-konsolen och Anthropic.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: initialize Next.js project with dependencies"
```

---

### Task 2: TypeScript types och Tailwind-tema

**Files:**
- Create: `lib/types.ts`, update `tailwind.config.js`

- [ ] **Step 1: Skriv alla delade typer**

Skapa `lib/types.ts`:
```typescript
export interface Goal {
  id: string;
  title: string;
  category: string;
  deadline: Date;
  progress: number;
  createdAt: Date;
}

export interface SubGoal {
  id: string;
  title: string;
  completed: boolean;
  completedAt: Date | null;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  goalId: string | null;
  createdAt: Date;
}

export interface CheckIn {
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5;
  reflection: string;
  createdAt: Date;
}

export interface Milestone {
  label: string;
  date: Date;
  percentage: number;
  completed: boolean;
}

export interface Promise {
  id: string;
  title: string;
  category: string;
  deadline: Date;
  durationDays: number;
  stakeAmount: number;
  charityOrg: string;
  milestones: Milestone[];
  status: 'active' | 'completed' | 'broken';
  createdAt: Date;
}

export interface FocusSession {
  id: string;
  mode: 'focus' | 'deep_work' | 'study' | 'custom';
  durationMinutes: number;
  completedAt: Date;
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CoachContext {
  streak: number;
  totalXp: number;
  goals: Pick<Goal, 'title' | 'progress' | 'deadline'>[];
  promises: Pick<Promise, 'title' | 'stakeAmount' | 'charityOrg'> & { daysLeft: number }[];
  lastCheckIn: Pick<CheckIn, 'mood' | 'reflection'> | null;
}
```

- [ ] **Step 2: Konfigurera Tailwind-paletten**

Uppdatera `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        earth: '#513229',
        cream: '#F4F1E2',
        sky: '#D8EBF9',
        bay: '#FCE6B7',
        sage: '#D7D4B1',
        streak: '#e07b39',
        'earth-light': '#7a5c54',
        'cream-dark': '#ede9da',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts tailwind.config.js && git commit -m "feat: add TypeScript types and Tailwind palette"
```

---

### Task 3: Utility-funktioner med TDD

**Files:**
- Create: `lib/utils/streak.ts`, `lib/utils/xp.ts`, `lib/utils/quotes.ts`, `lib/utils/milestones.ts`
- Create: `__tests__/utils/streak.test.ts`, `__tests__/utils/xp.test.ts`, `__tests__/utils/milestones.test.ts`

- [ ] **Step 1: Skriv streak-testerna (de ska misslyckas)**

Skapa `__tests__/utils/streak.test.ts`:
```typescript
import { calculateStreak } from '@/lib/utils/streak';

const fmt = (d: Date) => d.toISOString().split('T')[0];
const today = fmt(new Date());
const yesterday = fmt(new Date(Date.now() - 86400000));
const twoDaysAgo = fmt(new Date(Date.now() - 172800000));
const threeDaysAgo = fmt(new Date(Date.now() - 259200000));

describe('calculateStreak', () => {
  it('returns 0 for empty array', () => {
    expect(calculateStreak([])).toBe(0);
  });
  it('returns 1 for only today', () => {
    expect(calculateStreak([today])).toBe(1);
  });
  it('returns 2 for today and yesterday', () => {
    expect(calculateStreak([today, yesterday])).toBe(2);
  });
  it('returns 3 for three consecutive days', () => {
    expect(calculateStreak([today, yesterday, twoDaysAgo])).toBe(3);
  });
  it('breaks at gap', () => {
    expect(calculateStreak([today, twoDaysAgo])).toBe(1);
  });
  it('counts streak starting from yesterday if today is missing', () => {
    expect(calculateStreak([yesterday, twoDaysAgo, threeDaysAgo])).toBe(3);
  });
  it('returns 0 if newest date is older than yesterday', () => {
    expect(calculateStreak([twoDaysAgo, threeDaysAgo])).toBe(0);
  });
});
```

- [ ] **Step 2: Kör testerna — de ska misslyckas**

```bash
npx jest __tests__/utils/streak.test.ts
```
Förväntat: FAIL — "Cannot find module"

- [ ] **Step 3: Implementera streak-funktionen**

Skapa `lib/utils/streak.ts`:
```typescript
export function calculateStreak(completionDates: string[]): number {
  if (completionDates.length === 0) return 0;

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));

  const unique = [...new Set(completionDates)].sort().reverse();

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
```

- [ ] **Step 4: Kör testerna — de ska gå igenom**

```bash
npx jest __tests__/utils/streak.test.ts
```
Förväntat: PASS (7 tests)

- [ ] **Step 5: Skriv XP-testerna**

Skapa `__tests__/utils/xp.test.ts`:
```typescript
import { calculateXp } from '@/lib/utils/xp';

describe('calculateXp', () => {
  it('returns 0 for no completions', () => {
    expect(calculateXp(0)).toBe(0);
  });
  it('returns 10 per completion', () => {
    expect(calculateXp(5)).toBe(50);
  });
  it('returns correct value for 1 completion', () => {
    expect(calculateXp(1)).toBe(10);
  });
});
```

- [ ] **Step 6: Implementera XP**

Skapa `lib/utils/xp.ts`:
```typescript
const XP_PER_COMPLETION = 10;

export function calculateXp(completionCount: number): number {
  return completionCount * XP_PER_COMPLETION;
}
```

- [ ] **Step 7: Skriv milestones-testerna**

Skapa `__tests__/utils/milestones.test.ts`:
```typescript
import { generateMilestones } from '@/lib/utils/milestones';

describe('generateMilestones', () => {
  const start = new Date('2026-01-01');
  const end = new Date('2026-04-11'); // 100 days later

  it('returns 3 milestones', () => {
    expect(generateMilestones(start, end)).toHaveLength(3);
  });

  it('milestones are at 25%, 50%, 75%', () => {
    const ms = generateMilestones(start, end);
    expect(ms[0].percentage).toBe(25);
    expect(ms[1].percentage).toBe(50);
    expect(ms[2].percentage).toBe(75);
  });

  it('all milestones start as not completed', () => {
    const ms = generateMilestones(start, end);
    ms.forEach(m => expect(m.completed).toBe(false));
  });

  it('milestone dates are between start and end', () => {
    const ms = generateMilestones(start, end);
    ms.forEach(m => {
      expect(m.date.getTime()).toBeGreaterThan(start.getTime());
      expect(m.date.getTime()).toBeLessThan(end.getTime());
    });
  });
});
```

- [ ] **Step 8: Implementera milestones**

Skapa `lib/utils/milestones.ts`:
```typescript
import type { Milestone } from '@/lib/types';

export function generateMilestones(start: Date, end: Date): Milestone[] {
  const total = end.getTime() - start.getTime();
  return [25, 50, 75].map(pct => ({
    label: `${pct}% nådd`,
    date: new Date(start.getTime() + (total * pct) / 100),
    percentage: pct,
    completed: false,
  }));
}
```

- [ ] **Step 9: Skapa quotes**

Skapa `lib/utils/quotes.ts`:
```typescript
const QUOTES = [
  'Discipline is choosing between what you want now and what you want most.',
  'Small daily improvements lead to staggering long-term results.',
  'You don\'t rise to the level of your goals, you fall to the level of your systems.',
  'The secret of getting ahead is getting started.',
  'It always seems impossible until it\'s done.',
  'Don\'t watch the clock; do what it does. Keep going.',
  'Success is the sum of small efforts, repeated day in and day out.',
  'Dream big. Start small. Act now.',
];

export function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
```

- [ ] **Step 10: Kör alla utils-tester**

```bash
npx jest __tests__/utils/
```
Förväntat: PASS (alla)

- [ ] **Step 11: Commit**

```bash
git add lib/utils/ __tests__/utils/ && git commit -m "feat: add utility functions with tests (streak, xp, milestones, quotes)"
```

---

### Task 4: Firebase-konfiguration

**Files:**
- Create: `lib/firebase/config.ts`, `lib/firebase/admin.ts`, `lib/firebase/fcm.ts`

- [ ] **Step 1: Firebase client-konfiguration**

Skapa `lib/firebase/config.ts`:
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
```

- [ ] **Step 2: Firebase Admin (server-side)**

Skapa `lib/firebase/admin.ts`:
```typescript
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );
  adminApp = initializeApp({ credential: cert(serviceAccount) });
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
```

- [ ] **Step 3: FCM client-helper**

Skapa `lib/firebase/fcm.ts`:
```typescript
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './config';

export async function requestNotificationPermission(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
  });

  if (token) {
    await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true });
  }
  return !!token;
}

export function setupForegroundMessages(onReceive: (payload: unknown) => void) {
  if (typeof window === 'undefined') return;
  const messaging = getMessaging(app);
  return onMessage(messaging, onReceive);
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/firebase/ && git commit -m "feat: configure Firebase client and admin SDK"
```

---

### Task 5: Auth-hook och inloggningssida

**Files:**
- Create: `lib/hooks/useAuth.ts`, `app/(auth)/login/page.tsx`

- [ ] **Step 1: useAuth-hook**

Skapa `lib/hooks/useAuth.ts`:
```typescript
'use client';
import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  return { user, loading, login, register, logout };
}
```

- [ ] **Step 2: Login-sida**

Skapa `app/(auth)/login/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      router.push('/app');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Något gick fel');
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-earth mb-1">LockIn</h1>
        <p className="text-earth-light text-sm mb-8">Lock in your future.</p>

        <div className="flex rounded-xl overflow-hidden mb-6 border border-sage">
          <button
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-earth text-cream' : 'bg-cream text-earth-light'}`}
            onClick={() => setMode('login')}
          >
            Logga in
          </button>
          <button
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-earth text-cream' : 'bg-cream text-earth-light'}`}
            onClick={() => setMode('register')}
          >
            Registrera
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-sage bg-white text-earth placeholder-earth-light focus:outline-none focus:border-earth"
          />
          <input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-sage bg-white text-earth placeholder-earth-light focus:outline-none focus:border-earth"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-earth text-cream py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            {mode === 'login' ? 'Logga in' : 'Skapa konto'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/useAuth.ts app/ && git commit -m "feat: add auth hook and login/register page"
```

---

### Task 6: Skyddad layout och BottomNav

**Files:**
- Create: `components/layout/BottomNav.tsx`, `app/(app)/layout.tsx`, `app/layout.tsx`

- [ ] **Step 1: Root layout**

Skapa `app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LockIn',
  description: 'Lock in your future.',
  manifest: '/manifest.json',
  themeColor: '#513229',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="bg-cream">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: BottomNav**

Skapa `components/layout/BottomNav.tsx`:
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/app', label: 'Hem', icon: '🏠' },
  { href: '/app/goals', label: 'Mål', icon: '🎯' },
  { href: '/app/focus', label: 'Fokus', icon: '⏱' },
  { href: '/app/progress', label: 'Stats', icon: '📊' },
  { href: '/app/coach', label: 'Coach', icon: '🤖' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-cream border-t border-cream-dark flex justify-around py-2 z-50 max-w-md mx-auto">
      {NAV.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center text-xs gap-0.5 px-3 py-1 rounded-lg transition-colors ${active ? 'text-earth font-bold' : 'text-earth-light'}`}
          >
            <span className="text-xl">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Skyddad app-layout med auth-guard**

Skapa `app/(app)/layout.tsx`:
```tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-earth border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-cream pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/ components/layout/ && git commit -m "feat: add protected app layout with bottom nav"
```

---

### Task 7: Firestore-hooks

**Files:**
- Create: `lib/hooks/useGoals.ts`, `lib/hooks/useTasks.ts`, `lib/hooks/useCheckIn.ts`, `lib/hooks/usePromises.ts`, `lib/hooks/useFocusSessions.ts`

- [ ] **Step 1: useGoals**

Skapa `lib/hooks/useGoals.ts`:
```typescript
'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { Goal, SubGoal } from '@/lib/types';

function toGoal(id: string, data: Record<string, unknown>): Goal {
  return {
    id,
    title: data.title as string,
    category: data.category as string,
    deadline: (data.deadline as Timestamp).toDate(),
    progress: data.progress as number,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'goals'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setGoals(snap.docs.map(d => toGoal(d.id, d.data())));
      setLoading(false);
    });
  }, [user]);

  async function addGoal(data: Omit<Goal, 'id' | 'createdAt' | 'progress'>) {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'goals'), {
      ...data,
      deadline: Timestamp.fromDate(data.deadline),
      progress: 0,
      createdAt: Timestamp.now(),
    });
  }

  async function updateProgress(goalId: string, subGoals: SubGoal[]) {
    if (!user) return;
    const done = subGoals.filter(s => s.completed).length;
    const progress = subGoals.length ? Math.round((done / subGoals.length) * 100) : 0;
    await updateDoc(doc(db, 'users', user.uid, 'goals', goalId), { progress });
  }

  async function deleteGoal(goalId: string) {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'goals', goalId));
  }

  return { goals, loading, addGoal, updateProgress, deleteGoal };
}
```

- [ ] **Step 2: useTasks**

Skapa `lib/hooks/useTasks.ts`:
```typescript
'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, setDoc,
  doc, query, orderBy, Timestamp, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { Task } from '@/lib/types';

const todayKey = () => new Date().toISOString().split('T')[0];

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    });

    // Load today's completions
    getDoc(doc(db, 'users', user.uid, 'task_completions', todayKey())).then(snap => {
      if (snap.exists()) {
        setCompletedToday(new Set(Object.keys(snap.data())));
      }
    });

    return unsub;
  }, [user]);

  async function addTask(data: Omit<Task, 'id' | 'createdAt'>) {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      ...data,
      createdAt: Timestamp.now(),
    });
  }

  async function toggleTask(taskId: string) {
    if (!user) return;
    const isCompleted = completedToday.has(taskId);
    const ref = doc(db, 'users', user.uid, 'task_completions', todayKey());

    if (isCompleted) {
      setCompletedToday(prev => { const s = new Set(prev); s.delete(taskId); return s; });
      await setDoc(ref, { [taskId]: null }, { merge: true });
    } else {
      setCompletedToday(prev => new Set(prev).add(taskId));
      await setDoc(ref, { [taskId]: Timestamp.now() }, { merge: true });
    }
  }

  return { tasks, completedToday, loading, addTask, toggleTask };
}
```

- [ ] **Step 3: useCheckIn**

Skapa `lib/hooks/useCheckIn.ts`:
```typescript
'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { CheckIn } from '@/lib/types';

const todayKey = () => new Date().toISOString().split('T')[0];

export function useCheckIn() {
  const { user } = useAuth();
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid, 'check_ins', todayKey())).then(snap => {
      if (snap.exists()) setTodayCheckIn(snap.data() as CheckIn);
      setLoading(false);
    });
  }, [user]);

  async function checkIn(mood: CheckIn['mood'], reflection: string) {
    if (!user) return;
    const data: CheckIn = {
      date: todayKey(),
      mood,
      reflection,
      createdAt: new Date(),
    };
    await setDoc(doc(db, 'users', user.uid, 'check_ins', todayKey()), {
      ...data,
      createdAt: Timestamp.now(),
    });
    setTodayCheckIn(data);
  }

  return { todayCheckIn, loading, checkIn };
}
```

- [ ] **Step 4: usePromises**

Skapa `lib/hooks/usePromises.ts`:
```typescript
'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { Promise as UserPromise } from '@/lib/types';

export function usePromises() {
  const { user } = useAuth();
  const [promises, setPromises] = useState<UserPromise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'promises'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setPromises(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          deadline: (data.deadline as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp).toDate(),
          milestones: (data.milestones || []).map((m: Record<string, unknown>) => ({
            ...m,
            date: (m.date as Timestamp).toDate(),
          })),
        } as UserPromise;
      }));
      setLoading(false);
    });
  }, [user]);

  async function addPromise(data: Omit<UserPromise, 'id' | 'createdAt' | 'status'>) {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'promises'), {
      ...data,
      deadline: Timestamp.fromDate(data.deadline),
      milestones: data.milestones.map(m => ({ ...m, date: Timestamp.fromDate(m.date) })),
      status: 'active',
      createdAt: Timestamp.now(),
    });
  }

  async function updateStatus(id: string, status: UserPromise['status']) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'promises', id), { status });
  }

  return { promises, loading, addPromise, updateStatus };
}
```

- [ ] **Step 5: useFocusSessions**

Skapa `lib/hooks/useFocusSessions.ts`:
```typescript
'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc,
  query, where, Timestamp, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { FocusSession } from '@/lib/types';

export function useFocusSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);

  useEffect(() => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'users', user.uid, 'focus_sessions'),
      where('completedAt', '>=', Timestamp.fromDate(todayStart)),
      orderBy('completedAt', 'desc')
    );
    return onSnapshot(q, snap => {
      const s = snap.docs.map(d => ({ id: d.id, ...d.data() } as FocusSession));
      setSessions(s);
      setTodayMinutes(s.reduce((sum, s) => sum + s.durationMinutes, 0));
    });
  }, [user]);

  async function logSession(mode: FocusSession['mode'], durationMinutes: number) {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'focus_sessions'), {
      mode,
      durationMinutes,
      completedAt: Timestamp.now(),
    });
  }

  return { sessions, todayMinutes, logSession };
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/hooks/ && git commit -m "feat: add all Firestore data hooks"
```

---

### Task 8: UI-komponenter (Button, Modal, ProgressRing)

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Modal.tsx`, `components/ui/ProgressRing.tsx`

- [ ] **Step 1: Button**

Skapa `components/ui/Button.tsx`:
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const base = 'font-semibold rounded-xl transition-opacity disabled:opacity-50';
  const variants = {
    primary: 'bg-earth text-cream hover:opacity-90',
    outline: 'border-2 border-earth text-earth hover:bg-earth hover:text-cream',
    ghost: 'text-earth-light hover:text-earth',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'w-full py-3 text-base' };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
```

- [ ] **Step 2: Modal**

Skapa `components/ui/Modal.tsx`:
```tsx
'use client';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-cream rounded-t-2xl p-6 shadow-xl">
        {title && <h2 className="text-lg font-bold text-earth mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: ProgressRing**

Skapa `components/ui/ProgressRing.tsx`:
```tsx
interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ProgressRing({ percent, size = 80, strokeWidth = 6, label }: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D7D4B1" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#513229" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="text-earth font-bold text-sm z-10">{label ?? `${Math.round(percent)}%`}</span>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/ && git commit -m "feat: add Button, Modal, ProgressRing UI components"
```

---

### Task 9: Hem-dashboard

**Files:**
- Create: `components/home/ProgressSummary.tsx`, `components/home/DailyTasks.tsx`, `components/home/CheckInModal.tsx`, `components/home/CoachCard.tsx`, `app/(app)/page.tsx`

- [ ] **Step 1: ProgressSummary**

Skapa `components/home/ProgressSummary.tsx`:
```tsx
import { ProgressRing } from '@/components/ui/ProgressRing';

interface Props {
  completedCount: number;
  totalCount: number;
  streak: number;
  totalXp: number;
}

export function ProgressSummary({ completedCount, totalCount, streak, totalXp }: Props) {
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-earth-light mb-3">Dagens progress</p>
      <div className="flex items-center gap-4">
        <ProgressRing percent={percent} size={72} />
        <div className="space-y-1">
          <p className="text-sm text-earth">{completedCount}/{totalCount} <span className="text-earth-light">Mål klara</span></p>
          <p className="text-sm text-earth">{streak} <span className="text-earth-light">Dagar i rad 🔥</span></p>
          <p className="text-sm text-earth">{totalXp} <span className="text-earth-light">XP</span></p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CheckInModal**

Skapa `components/home/CheckInModal.tsx`:
```tsx
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
    setSaving(true);
    await onSubmit(mood, reflection);
    setSaving(false);
    setReflection('');
    onClose();
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
```

- [ ] **Step 3: DailyTasks**

Skapa `components/home/DailyTasks.tsx`:
```tsx
import { Button } from '@/components/ui/Button';
import type { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  onAdd: () => void;
}

export function DailyTasks({ tasks, completedIds, onToggle, onAdd }: Props) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-earth-light mb-3">Dagens uppgifter</p>
      <div className="space-y-2 mb-3">
        {tasks.length === 0 && (
          <p className="text-sm text-earth-light py-2">Inga uppgifter ännu.</p>
        )}
        {tasks.map(task => {
          const done = completedIds.has(task.id);
          return (
            <button
              key={task.id}
              onClick={() => onToggle(task.id)}
              className="w-full flex items-center gap-3 py-3 px-4 bg-white rounded-xl shadow-sm text-left"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${done ? 'bg-earth border-earth' : 'border-sage'}`}>
                {done && <span className="text-cream text-xs">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? 'line-through text-earth-light' : 'text-earth'}`}>{task.title}</p>
                <p className="text-xs text-earth-light">{task.category}</p>
              </div>
            </button>
          );
        })}
      </div>
      <Button variant="outline" size="lg" onClick={onAdd}>+ Lägg till uppgift</Button>
    </div>
  );
}
```

- [ ] **Step 4: CoachCard**

Skapa `components/home/CoachCard.tsx`:
```tsx
'use client';
import { useRouter } from 'next/navigation';

export function CoachCard() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/app/coach')}
      className="w-full bg-earth text-cream rounded-2xl p-4 text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <p className="font-semibold text-sm">AI-coach</p>
          <p className="text-xs opacity-70">Prata med din personliga coach →</p>
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 5: Sätt ihop Hem-dashboard**

Skapa `app/(app)/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTasks } from '@/lib/hooks/useTasks';
import { useCheckIn } from '@/lib/hooks/useCheckIn';
import { useGoals } from '@/lib/hooks/useGoals';
import { calculateStreak } from '@/lib/utils/streak';
import { calculateXp } from '@/lib/utils/xp';
import { getDailyQuote } from '@/lib/utils/quotes';
import { ProgressSummary } from '@/components/home/ProgressSummary';
import { DailyTasks } from '@/components/home/DailyTasks';
import { CheckInModal } from '@/components/home/CheckInModal';
import { CoachCard } from '@/components/home/CoachCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { user } = useAuth();
  const { tasks, completedToday, addTask, toggleTask } = useTasks();
  const { todayCheckIn, checkIn } = useCheckIn();
  const { goals } = useGoals();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: '' });

  const streak = calculateStreak([]); // TODO: fetch completion dates
  const totalXp = calculateXp(completedToday.size);
  const name = user?.displayName || user?.email?.split('@')[0] || 'du';

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-earth">Hej, {name} 👋</h1>
          <p className="text-sm text-earth-light">Låt's lock in idag.</p>
        </div>
        {!todayCheckIn ? (
          <button
            onClick={() => setCheckInOpen(true)}
            className="text-sm bg-bay text-earth px-3 py-1.5 rounded-full font-medium"
          >
            Checka in →
          </button>
        ) : (
          <span className="text-sm text-earth-light">
            {['😔','😕','😐','🙂','😄'][todayCheckIn.mood - 1]} Incheckad
          </span>
        )}
      </div>

      {/* Dagligt citat */}
      <div className="bg-earth rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-cream/60 mb-2">Dagens citat</p>
        <p className="text-cream text-sm leading-relaxed italic">"{getDailyQuote()}"</p>
      </div>

      {/* Progress */}
      <ProgressSummary
        completedCount={completedToday.size}
        totalCount={tasks.length}
        streak={streak}
        totalXp={totalXp}
      />

      {/* AI Coach */}
      <CoachCard />

      {/* Tasks */}
      <DailyTasks
        tasks={tasks}
        completedIds={completedToday}
        onToggle={toggleTask}
        onAdd={() => setAddTaskOpen(true)}
      />

      {/* Modaler */}
      <CheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSubmit={checkIn}
      />

      <Modal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} title="Ny uppgift">
        <input
          placeholder="Vad ska du göra?"
          value={newTask.title}
          onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm mb-3 focus:outline-none focus:border-earth"
        />
        <input
          placeholder="Kategori (t.ex. Hälsa)"
          value={newTask.category}
          onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm mb-4 focus:outline-none focus:border-earth"
        />
        <Button size="lg" onClick={async () => {
          if (!newTask.title) return;
          await addTask({ ...newTask, goalId: null });
          setNewTask({ title: '', category: '' });
          setAddTaskOpen(false);
        }}>
          Lägg till
        </Button>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/ components/home/ && git commit -m "feat: add home dashboard with check-in, tasks, and coach card"
```

---

### Task 10: Mål-sidan

**Files:**
- Create: `components/goals/GoalCard.tsx`, `components/goals/GoalForm.tsx`, `app/(app)/goals/page.tsx`

- [ ] **Step 1: GoalCard**

Skapa `components/goals/GoalCard.tsx`:
```tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Goal, SubGoal } from '@/lib/types';

interface Props {
  goal: Goal;
  onProgressUpdate: (goalId: string, subGoals: SubGoal[]) => void;
}

export function GoalCard({ goal, onProgressUpdate }: Props) {
  const { user } = useAuth();
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user || !expanded) return;
    return onSnapshot(
      collection(db, 'users', user.uid, 'goals', goal.id, 'sub_goals'),
      snap => setSubGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubGoal)))
    );
  }, [user, goal.id, expanded]);

  async function toggleSubGoal(subGoal: SubGoal) {
    if (!user) return;
    const updated = { completed: !subGoal.completed, completedAt: !subGoal.completed ? Timestamp.now() : null };
    await updateDoc(doc(db, 'users', user.uid, 'goals', goal.id, 'sub_goals', subGoal.id), updated);
    const next = subGoals.map(s => s.id === subGoal.id ? { ...s, ...updated } : s);
    onProgressUpdate(goal.id, next as SubGoal[]);
  }

  const daysLeft = Math.ceil((goal.deadline.getTime() - Date.now()) / 86400000);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button className="w-full p-4 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between mb-2">
          <p className="font-semibold text-earth text-sm flex-1">{goal.category} {goal.title}</p>
          <span className="text-xs text-earth-light ml-2">{expanded ? '▲' : '▼'}</span>
        </div>
        <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden mb-1">
          <div className="h-full bg-earth rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-earth-light">
          <span>{goal.progress}%</span>
          <span>{daysLeft > 0 ? `${daysLeft} dagar kvar` : 'Passerad deadline'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-cream-dark">
          {subGoals.length === 0 && <p className="text-sm text-earth-light py-3">Inga delmål.</p>}
          {subGoals.map(sg => (
            <button
              key={sg.id}
              onClick={() => toggleSubGoal(sg)}
              className="w-full flex items-center gap-3 py-2.5 text-left border-b border-cream-dark last:border-0"
            >
              <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${sg.completed ? 'bg-earth border-earth' : 'border-sage'}`}>
                {sg.completed && <span className="text-cream text-xs">✓</span>}
              </div>
              <span className={`text-sm ${sg.completed ? 'line-through text-earth-light' : 'text-earth'}`}>{sg.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: GoalForm**

Skapa `components/goals/GoalForm.tsx`:
```tsx
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
    if (!title || !deadline) return;
    setSaving(true);
    await onSubmit({ title, category, deadline: new Date(deadline) }, subGoals);
    setTitle(''); setCategory(CATEGORIES[0]); setDeadline(''); setSubGoals([]);
    setSaving(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nytt mål">
      <div className="space-y-3 max-h-[70vh] overflow-y-auto">
        <input
          placeholder="Vad vill du uppnå?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth bg-white"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth"
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
              className="flex-1 px-3 py-1.5 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth"
            />
            <Button variant="outline" size="sm" onClick={addSubGoal}>+</Button>
          </div>
        </div>
      </div>
      <Button size="lg" className="mt-4" onClick={handleSubmit} disabled={saving}>
        {saving ? 'Sparar...' : 'Skapa mål'}
      </Button>
    </Modal>
  );
}
```

- [ ] **Step 3: Goals page**

Skapa `app/(app)/goals/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGoals } from '@/lib/hooks/useGoals';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalForm } from '@/components/goals/GoalForm';
import { Button } from '@/components/ui/Button';
import type { Goal, SubGoal } from '@/lib/types';

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, loading, addGoal, updateProgress } = useGoals();
  const [formOpen, setFormOpen] = useState(false);

  async function handleAddGoal(data: Omit<Goal, 'id' | 'createdAt' | 'progress'>, subGoalTitles: string[]) {
    if (!user) return;
    const goalRef = await addDoc(collection(db, 'users', user.uid, 'goals'), {
      ...data,
      deadline: Timestamp.fromDate(data.deadline),
      progress: 0,
      createdAt: Timestamp.now(),
    });
    for (const title of subGoalTitles) {
      await addDoc(collection(db, 'users', user.uid, 'goals', goalRef.id, 'sub_goals'), {
        title, completed: false, completedAt: null,
      });
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-earth">Mina mål</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>+ Nytt mål</Button>
      </div>

      {loading && <p className="text-earth-light text-sm">Laddar...</p>}
      {!loading && goals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-earth-light text-sm mb-4">Inga mål ännu. Sätt ditt första mål!</p>
          <Button onClick={() => setFormOpen(true)}>Skapa mål</Button>
        </div>
      )}

      <div className="space-y-3">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} onProgressUpdate={updateProgress} />
        ))}
      </div>

      <GoalForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAddGoal} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/ components/goals/ && git commit -m "feat: add goals page with sub-goals"
```

---

### Task 11: Fokustimer

**Files:**
- Create: `components/focus/FocusTimer.tsx`, `app/(app)/focus/page.tsx`

- [ ] **Step 1: FocusTimer-komponent**

Skapa `components/focus/FocusTimer.tsx`:
```tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Button } from '@/components/ui/Button';
import type { FocusSession } from '@/lib/types';

const MODES: { key: FocusSession['mode']; label: string; minutes: number }[] = [
  { key: 'focus', label: 'Focus', minutes: 25 },
  { key: 'deep_work', label: 'Deep Work', minutes: 90 },
  { key: 'study', label: 'Study', minutes: 50 },
  { key: 'custom', label: 'Custom', minutes: 30 },
];

interface Props {
  todayMinutes: number;
  onSessionComplete: (mode: FocusSession['mode'], minutes: number) => Promise<void>;
}

export function FocusTimer({ todayMinutes, onSessionComplete }: Props) {
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(30);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalSeconds = selectedMode.minutes * 60;
  const percent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const handleComplete = useCallback(async () => {
    setRunning(false);
    await onSessionComplete(selectedMode.key, selectedMode.minutes);
    setSecondsLeft(selectedMode.minutes * 60);
  }, [selectedMode, onSessionComplete]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current!); handleComplete(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, handleComplete]);

  useEffect(() => {
    const mins = selectedMode.key === 'custom' ? customMinutes : selectedMode.minutes;
    setSecondsLeft(mins * 60);
    setRunning(false);
  }, [selectedMode, customMinutes]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (running) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [running]);

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  const todayHours = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => setSelectedMode(m)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${selectedMode.key === m.key ? 'bg-earth text-cream' : 'bg-cream-dark text-earth-light'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {selectedMode.key === 'custom' && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-earth-light">Minuter:</label>
          <input
            type="number"
            min={1} max={300}
            value={customMinutes}
            onChange={e => setCustomMinutes(Number(e.target.value))}
            className="w-20 px-3 py-1.5 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth"
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <ProgressRing percent={percent} size={160} strokeWidth={8} label={`${mins}:${secs}`} />
        <p className="text-sm text-earth-light">Dags att låsa in. Du klarar detta.</p>
        <Button
          size="lg"
          onClick={() => setRunning(r => !r)}
          variant={running ? 'outline' : 'primary'}
        >
          {running ? 'Pausa' : secondsLeft < totalSeconds ? 'Fortsätt' : 'Starta fokus'}
        </Button>
        <p className="text-sm text-earth-light">
          Idag fokuserat <span className="text-earth font-semibold">{todayHours}h {todayMins}m</span>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Focus page**

Skapa `app/(app)/focus/page.tsx`:
```tsx
'use client';
import { useFocusSessions } from '@/lib/hooks/useFocusSessions';
import { FocusTimer } from '@/components/focus/FocusTimer';

export default function FocusPage() {
  const { todayMinutes, logSession } = useFocusSessions();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-earth pt-2 mb-6">Fokusläge</h1>
      <FocusTimer todayMinutes={todayMinutes} onSessionComplete={logSession} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/ components/focus/ && git commit -m "feat: add focus timer with session logging"
```

---

### Task 12: Löften

**Files:**
- Create: `components/promises/PromiseCard.tsx`, `components/promises/PromiseForm.tsx`, `app/(app)/promises/page.tsx`

- [ ] **Step 1: PromiseCard**

Skapa `components/promises/PromiseCard.tsx`:
```tsx
import { Button } from '@/components/ui/Button';
import type { Promise as UserPromise } from '@/lib/types';

interface Props {
  promise: UserPromise;
  onUpdateStatus: (id: string, status: UserPromise['status']) => void;
}

export function PromiseCard({ promise, onUpdateStatus }: Props) {
  const daysLeft = Math.ceil((promise.deadline.getTime() - Date.now()) / 86400000);
  const completedMilestones = promise.milestones.filter(m => m.completed).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-earth text-sm mb-1">{promise.category} {promise.title}</p>
          <p className="text-xs text-earth-light">
            {daysLeft > 0 ? `${daysLeft} dagar kvar` : 'Passerad deadline'} · {promise.stakeAmount} kr → {promise.charityOrg}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${promise.status === 'active' ? 'bg-sky text-earth' : promise.status === 'completed' ? 'bg-sage text-earth' : 'bg-red-100 text-red-700'}`}>
          {promise.status === 'active' ? 'Aktivt' : promise.status === 'completed' ? 'Hållet ✓' : 'Brutet'}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-xs text-earth-light mb-2">Milstolpar ({completedMilestones}/{promise.milestones.length})</p>
        <div className="flex gap-2">
          {promise.milestones.map((m, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${m.completed ? 'bg-earth' : 'bg-cream-dark'}`} />
          ))}
        </div>
      </div>

      {promise.status === 'active' && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus(promise.id, 'completed')}>
            Hållet ✓
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onUpdateStatus(promise.id, 'broken')}>
            Brutet
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: PromiseForm (3-stegs)**

Skapa `components/promises/PromiseForm.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { generateMilestones } from '@/lib/utils/milestones';
import type { Promise as UserPromise } from '@/lib/types';

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

  async function handleSubmit() {
    if (!title || !deadline || !stakeAmount) return;
    setSaving(true);
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
    setStep(1); setTitle(''); setCategory(CATEGORIES[0]);
    setDeadline(''); setStakeAmount(''); setCharityOrg(CHARITIES[0]);
    setSaving(false);
    onClose();
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
            className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm resize-none focus:outline-none focus:border-earth"
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
            className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth"
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
            className="w-full px-3 py-2 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth"
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
              "{formattedPromise}"
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
```

- [ ] **Step 3: Promises page**

Skapa `app/(app)/promises/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { usePromises } from '@/lib/hooks/usePromises';
import { PromiseCard } from '@/components/promises/PromiseCard';
import { PromiseForm } from '@/components/promises/PromiseForm';
import { Button } from '@/components/ui/Button';
import type { Promise as UserPromise } from '@/lib/types';

export default function PromisesPage() {
  const { promises, loading, addPromise, updateStatus } = usePromises();
  const [formOpen, setFormOpen] = useState(false);
  const active = promises.filter(p => p.status === 'active');
  const past = promises.filter(p => p.status !== 'active');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-earth">Mina löften</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>+ Nytt löfte</Button>
      </div>

      {loading && <p className="text-earth-light text-sm">Laddar...</p>}
      {!loading && promises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-earth-light text-sm mb-4">Inga löften ännu.<br/>Lägg till ett och håll dig accountable.</p>
          <Button onClick={() => setFormOpen(true)}>Skapa löfte</Button>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-earth-light">Aktiva</p>
          {active.map(p => <PromiseCard key={p.id} promise={p} onUpdateStatus={updateStatus} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-earth-light">Avslutade</p>
          {past.map(p => <PromiseCard key={p.id} promise={p} onUpdateStatus={updateStatus} />)}
        </div>
      )}

      <PromiseForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={addPromise} />
    </div>
  );
}
```

- [ ] **Step 4: Lägg till Löften i BottomNav**

Uppdatera `components/layout/BottomNav.tsx` — lägg till löften-länk:
```typescript
const NAV = [
  { href: '/app', label: 'Hem', icon: '🏠' },
  { href: '/app/goals', label: 'Mål', icon: '🎯' },
  { href: '/app/promises', label: 'Löften', icon: '🔒' },
  { href: '/app/focus', label: 'Fokus', icon: '⏱' },
  { href: '/app/coach', label: 'Coach', icon: '🤖' },
];
```

- [ ] **Step 5: Commit**

```bash
git add app/ components/promises/ components/layout/ && git commit -m "feat: add promises page with 3-step form and milestones"
```

---

### Task 13: Progress-sidan

**Files:**
- Create: `components/progress/ActivityChart.tsx`, `app/(app)/progress/page.tsx`

- [ ] **Step 1: ActivityChart**

Skapa `components/progress/ActivityChart.tsx`:
```tsx
interface DataPoint { label: string; value: number; isToday?: boolean; }

interface Props { data: DataPoint[]; maxValue?: number; }

export function ActivityChart({ data, maxValue }: Props) {
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-md transition-all ${d.isToday ? 'bg-earth' : 'bg-earth/40'}`}
              style={{ height: `${Math.round((d.value / max) * 100)}%`, minHeight: d.value > 0 ? '4px' : '0' }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1">
        {data.map((d, i) => (
          <div key={i} className={`flex-1 text-center text-xs ${d.isToday ? 'text-earth font-bold' : 'text-earth-light'}`}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Progress page**

Skapa `app/(app)/progress/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useFocusSessions } from '@/lib/hooks/useFocusSessions';
import { ActivityChart } from '@/components/progress/ActivityChart';

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export default function ProgressPage() {
  const { sessions, todayMinutes } = useFocusSessions();
  const [period, setPeriod] = useState<'vecka' | 'månad'>('vecka');

  const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0
  const weekData = DAY_LABELS.map((label, i) => ({
    label,
    value: 0,
    isToday: i === todayIdx,
  }));
  weekData[todayIdx].value = todayMinutes;

  const totalHours = Math.floor(todayMinutes / 60);
  const totalMins = todayMinutes % 60;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-earth pt-2">Min progress</h1>

      <div className="flex gap-2">
        {(['vecka', 'månad'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${period === p ? 'bg-earth text-cream' : 'bg-cream-dark text-earth-light'}`}
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
          <div key={stat.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-lg font-bold text-earth">{stat.value}</p>
            <p className="text-xs text-earth-light">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-earth-light mb-3">Veckans aktivitet (min)</p>
        <ActivityChart data={weekData} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/ components/progress/ && git commit -m "feat: add progress page with activity chart"
```

---

### Task 14: AI-coach API-route

**Files:**
- Create: `app/api/coach/route.ts`

- [ ] **Step 1: Skapa API-route med Claude + auth-verifiering**

Skapa `app/api/coach/route.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { adminAuth } from '@/lib/firebase/admin';
import type { CoachContext, CoachMessage } from '@/lib/types';

const client = new Anthropic();

function buildSystemPrompt(ctx: CoachContext): string {
  const goalsList = ctx.goals.length
    ? ctx.goals.map(g => `  - ${g.title}: ${g.progress}% klar, deadline ${new Date(g.deadline).toLocaleDateString('sv-SE')}`).join('\n')
    : '  Inga aktiva mål';

  const promisesList = ctx.promises.length
    ? ctx.promises.map(p => `  - ${p.title}: ${p.daysLeft} dagar kvar, insats ${p.stakeAmount} kr → ${p.charityOrg}`).join('\n')
    : '  Inga aktiva löften';

  const checkInText = ctx.lastCheckIn
    ? `Humör: ${ctx.lastCheckIn.mood}/5. Reflektion: "${ctx.lastCheckIn.reflection || 'ingen reflektion'}"`
    : 'Ingen incheckning idag';

  return `Du är en personlig AI-coach i LockIn-appen. Du är direkt, empatisk men ställer jobbiga följdfrågor. Du håller användaren accountable — ger inte bara beröm. Svarar alltid på svenska. Håll svaren koncisa (max 3-4 meningar).

ANVÄNDARDATA:
- Streak: ${ctx.streak} dagar i rad 🔥
- Totalt XP: ${ctx.totalXp}

AKTIVA MÅL:
${goalsList}

AKTIVA LÖFTEN:
${promisesList}

SENASTE INCHECKNING:
${checkInText}

Ställ konkreta, utmanande följdfrågor. Acceptera inte vaga svar. Om användaren undviker en fråga — ställ den igen.`;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  const { messages, context }: { messages: CoachMessage[]; context: CoachContext } = await req.json();
  const systemPrompt = buildSystemPrompt(context);

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  return new Response(stream.toReadableStream());
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/ lib/firebase/admin.ts && git commit -m "feat: add Claude AI coach API route with Firebase auth verification"
```

---

### Task 15: AI-coach chat-UI

**Files:**
- Create: `components/coach/ChatInterface.tsx`, `app/(app)/coach/page.tsx`

- [ ] **Step 1: ChatInterface**

Skapa `components/coach/ChatInterface.tsx`:
```tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { CoachMessage, CoachContext } from '@/lib/types';

interface Props {
  context: CoachContext;
  getIdToken: () => Promise<string>;
}

export function ChatInterface({ context, getIdToken }: Props) {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      role: 'assistant',
      content: `Hej! Jag är din personliga coach. Du har ${context.streak} dagars streak 🔥 och ${context.goals.length} aktiva mål. ${context.goals.length > 0 ? `Hur går det med "${context.goals[0].title}"?` : 'Vad jobbar du mot just nu?'}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: CoachMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const token = await getIdToken();
    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: newMessages, context }),
    });

    if (!res.ok || !res.body) { setLoading(false); return; }

    const assistantMsg: CoachMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta' && data.delta?.text) {
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + data.delta.text,
              };
              return updated;
            });
          }
        } catch { /* ignore parse errors */ }
      }
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-earth text-cream rounded-br-sm' : 'bg-white text-earth shadow-sm rounded-bl-sm'}`}>
              {msg.content || <span className="animate-pulse">...</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-cream-dark">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Skriv ett meddelande..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-sage text-earth text-sm focus:outline-none focus:border-earth disabled:opacity-50"
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} size="sm">
          Skicka
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Coach page**

Skapa `app/(app)/coach/page.tsx`:
```tsx
'use client';
import { useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGoals } from '@/lib/hooks/useGoals';
import { usePromises } from '@/lib/hooks/usePromises';
import { useCheckIn } from '@/lib/hooks/useCheckIn';
import { ChatInterface } from '@/components/coach/ChatInterface';
import type { CoachContext } from '@/lib/types';

export default function CoachPage() {
  const { user } = useAuth();
  const { goals } = useGoals();
  const { promises } = usePromises();
  const { todayCheckIn } = useCheckIn();

  const context: CoachContext = useMemo(() => ({
    streak: 0, // TODO: wire up streak calculation
    totalXp: 0,
    goals: goals.map(g => ({ title: g.title, progress: g.progress, deadline: g.deadline })),
    promises: promises
      .filter(p => p.status === 'active')
      .map(p => ({
        title: p.title,
        stakeAmount: p.stakeAmount,
        charityOrg: p.charityOrg,
        daysLeft: Math.ceil((p.deadline.getTime() - Date.now()) / 86400000),
      })),
    lastCheckIn: todayCheckIn ? { mood: todayCheckIn.mood, reflection: todayCheckIn.reflection } : null,
  }), [goals, promises, todayCheckIn]);

  async function getIdToken() {
    return (await user?.getIdToken()) ?? '';
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <h1 className="text-xl font-bold text-earth pt-2 mb-4">🤖 AI-coach</h1>
      <ChatInterface context={context} getIdToken={getIdToken} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/ components/coach/ && git commit -m "feat: add AI coach chat interface with streaming Claude responses"
```

---

### Task 16: Landningssida

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Landningssida**

Skapa `app/page.tsx`:
```tsx
import Link from 'next/link';

const FEATURES = [
  { icon: '🎯', title: 'Sätt mål', desc: 'Bryt ner dina drömmar till konkreta steg.' },
  { icon: '🔒', title: 'Håll löften', desc: 'Lägg pengar på spel. Hedersbaserat.' },
  { icon: '⏱', title: 'Fokusera', desc: 'Minimera distraktioner och maximera din tid.' },
  { icon: '🤖', title: 'AI-coach', desc: 'En coach som ställer de jobbiga frågorna.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-earth mb-2">LockIn</h1>
          <p className="text-earth-light text-lg">Lock in your future.</p>
          <p className="text-earth-light text-sm mt-3 max-w-xs mx-auto">
            Den ultimata appen för att sätta mål, bygga vanor och hålla dig accountable — varje dag.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-10">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-4 shadow-sm">
              <span className="text-2xl mb-2 block">{f.icon}</span>
              <h3 className="font-semibold text-earth text-sm mb-1">{f.title}</h3>
              <p className="text-earth-light text-xs">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-earth text-cream text-center py-3.5 rounded-2xl font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Kom igång gratis
          </Link>
          <p className="text-center text-xs text-earth-light">
            Discipline today, freedom tomorrow.
          </p>
        </div>

        <div className="mt-12 p-4 bg-bay rounded-2xl text-center">
          <p className="text-earth text-sm italic">"Discipline is choosing between what you want now and what you want most."</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx && git commit -m "feat: add landing page"
```

---

### Task 17: PWA-konfiguration

**Files:**
- Create: `public/manifest.json`, update `next.config.js`

- [ ] **Step 1: PWA manifest**

Skapa `public/manifest.json`:
```json
{
  "name": "LockIn",
  "short_name": "LockIn",
  "description": "Lock in your future.",
  "start_url": "/app",
  "display": "standalone",
  "background_color": "#F4F1E2",
  "theme_color": "#513229",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Skapa placeholder-ikoner**

```bash
mkdir -p public/icons
# Skapa enkla placeholder PNG-ikoner (192x192 och 512x512)
# Ersätt med riktiga ikoner innan lansering
node -e "
const { createCanvas } = require('canvas');
// Om canvas inte finns: skapa ikonerna manuellt eller med ett verktyg som Figma
console.log('Skapa ikonerna manuellt i public/icons/: icon-192.png och icon-512.png');
"
```

Om `canvas` inte är installerat — skapa ikonerna i Figma eller liknande och exportera som PNG till `public/icons/`.

- [ ] **Step 3: Konfigurera next-pwa**

Uppdatera `next.config.js`:
```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    skipWaiting: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
```

- [ ] **Step 4: Commit**

```bash
git add public/ next.config.js && git commit -m "feat: configure PWA manifest and service worker"
```

---

### Task 18: Firebase Cloud Messaging (push-notiser)

**Files:**
- Create: `public/firebase-messaging-sw.js`, update `app/(app)/profile/page.tsx`

- [ ] **Step 1: FCM Service Worker**

Skapa `public/firebase-messaging-sw.js`:
```javascript
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
});
```

**OBS:** Firebase-konfigurationen i service workern kan inte läsa `process.env`. Skapa ett skript som injicerar värdena vid byggtid, eller hårdkoda de publika värdena (de är ändå publika).

Uppdatera `public/firebase-messaging-sw.js` med hårdkodade publika värden (inga secrets):
```javascript
// Ersätt self.FIREBASE_* med faktiska värden från .env.local
// T.ex. apiKey: "AIza..."
```

- [ ] **Step 2: Profilsida med notis-permission**

Skapa `app/(app)/profile/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { requestNotificationPermission } from '@/lib/firebase/fcm';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const router = useRouter();

  async function handleEnableNotifications() {
    if (!user) return;
    const granted = await requestNotificationPermission(user.uid);
    setNotifStatus(granted ? 'granted' : 'denied');
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-earth pt-2">Profil</h1>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-earth-light mb-1">Inloggad som</p>
        <p className="text-earth font-medium">{user?.email}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-earth mb-2">Push-notiser</p>
        <p className="text-xs text-earth-light mb-3">
          Aktivera för påminnelser om incheckning och streak.
        </p>
        {notifStatus === 'granted' ? (
          <p className="text-sm text-earth">✓ Notiser aktiverade</p>
        ) : notifStatus === 'denied' ? (
          <p className="text-sm text-red-600">Notiser nekade. Aktivera i webbläsarens inställningar.</p>
        ) : (
          <Button variant="outline" onClick={handleEnableNotifications}>
            Aktivera notiser 🔔
          </Button>
        )}
      </div>

      <Button variant="outline" size="lg" onClick={handleLogout}>
        Logga ut
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add public/firebase-messaging-sw.js app/ && git commit -m "feat: add FCM service worker and notification permission flow"
```

---

### Task 19: Firebase Cloud Functions (schemalagda notiser)

**Files:**
- Create: `functions/src/index.ts`, `functions/package.json`, `functions/tsconfig.json`

- [ ] **Step 1: Uppgradera Firebase-projektet till Blaze-planen**

Gå till [console.firebase.google.com](https://console.firebase.google.com), välj ditt projekt → Spark → Blaze. Lägg till betalkort (du debiteras inte inom gratis-gränserna).

- [ ] **Step 2: Initiera Firebase Functions**

```bash
cd lockin
npx firebase init functions
# Välj: TypeScript, Ja till ESLint, Nej till install nu
cd functions
npm install firebase-admin firebase-functions
```

- [ ] **Step 3: Skriv Cloud Functions**

Skriv `functions/src/index.ts`:
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const todayKey = () => new Date().toISOString().split('T')[0];

async function sendToUser(userId: string, title: string, body: string) {
  const userDoc = await db.doc(`users/${userId}`).get();
  const token = userDoc.data()?.fcmToken;
  if (!token) return;
  await messaging.send({ token, notification: { title, body } });
}

// Kl 20:00 varje dag — påminnelse om incheckning
export const dailyCheckInReminder = functions.pubsub
  .schedule('0 20 * * *')
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const today = todayKey();
    const usersSnap = await db.collection('users').get();
    const promises = usersSnap.docs.map(async userDoc => {
      const checkIn = await db.doc(`users/${userDoc.id}/check_ins/${today}`).get();
      if (!checkIn.exists) {
        await sendToUser(userDoc.id, 'LockIn 📋', 'Du har inte checkat in idag. Hur mår du?');
      }
    });
    await Promise.all(promises);
  });

// Kl 09:00 varje dag — milstolpe nådd
export const milestoneCheck = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const today = todayKey();
    const usersSnap = await db.collection('users').get();
    const promises = usersSnap.docs.map(async userDoc => {
      const uid = userDoc.id;
      const promisesSnap = await db.collection(`users/${uid}/promises`)
        .where('status', '==', 'active').get();
      for (const promDoc of promisesSnap.docs) {
        const milestones: { date: admin.firestore.Timestamp; completed: boolean; label: string }[] =
          promDoc.data().milestones || [];
        for (const ms of milestones) {
          const msDate = ms.date.toDate().toISOString().split('T')[0];
          if (msDate === today && !ms.completed) {
            await sendToUser(uid, 'LockIn 🏆', `Milstolpe nådd: ${ms.label} för "${promDoc.data().title}"`);
          }
        }
      }
    });
    await Promise.all(promises);
  });

// Kl 21:00 varje dag — streak i fara
export const streakWarning = functions.pubsub
  .schedule('0 21 * * *')
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const today = todayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const usersSnap = await db.collection('users').get();

    const promises = usersSnap.docs.map(async userDoc => {
      const uid = userDoc.id;
      const todayComp = await db.doc(`users/${uid}/task_completions/${today}`).get();
      const yesterdayComp = await db.doc(`users/${uid}/task_completions/${yesterday}`).get();

      if (!todayComp.exists && yesterdayComp.exists) {
        await sendToUser(uid, 'LockIn 🔥', 'Din streak är i fara! Slutför en uppgift idag.');
      }
    });
    await Promise.all(promises);
  });
```

- [ ] **Step 4: Bygg och deploya**

```bash
cd functions
npm run build
cd ..
npx firebase deploy --only functions
```

Förväntat output: `Deploy complete!` med function-URL:er listade.

- [ ] **Step 5: Commit**

```bash
git add functions/ && git commit -m "feat: add Firebase Cloud Functions for scheduled push notifications"
```

---

### Task 20: Sluttest och produktionsbygge

- [ ] **Step 1: Kör alla tester**

```bash
npx jest
```
Förväntat: alla tester PASS.

- [ ] **Step 2: Produktionsbygge**

```bash
npm run build
```
Förväntat: inga TypeScript-fel, inga build-fel.

- [ ] **Step 3: Lokal produktionstestning**

```bash
npm start
```
Öppna `http://localhost:3000` och testa:
- [ ] Registrera nytt konto
- [ ] Logga in och se hem-dashboard
- [ ] Lägg till en uppgift och checka av den
- [ ] Skapa ett mål med delmål
- [ ] Skapa ett löfte (alla 3 steg)
- [ ] Starta en fokussession och låt den slutföras
- [ ] Prata med AI-coachen
- [ ] Aktivera push-notiser i profilen
- [ ] Verifiera att appen kan installeras som PWA (webbläsarens install-prompt)

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat: LockIn MVP complete — goals, promises, focus timer, AI coach, push notifications"
```

---

## Noteringar

**Firebase Blaze-plan:** Krävs för Cloud Functions (Task 19). Uppgradera innan deploy.

**PWA-ikoner:** Ersätt placeholder-ikonerna i `public/icons/` med riktiga ikoner i storlek 192×192 och 512×512 px innan lansering.

**FCM Service Worker:** De publika Firebase-konfigurationsvärdena i `public/firebase-messaging-sw.js` är säkra att hårdkoda — de är synliga i klientappen ändå.

**Streak på Hem-sidan:** `calculateStreak([])` i `app/(app)/page.tsx` är en TODO — behöver hämta faktiska completion-datum från Firestore och skicka in som strängar.

**Deployment:** Appen kan deployas till Vercel med `vercel --prod`. Lägg till alla `NEXT_PUBLIC_*`- och `FIREBASE_SERVICE_ACCOUNT_KEY`-miljövariabler i Vercel-projektets inställningar.
