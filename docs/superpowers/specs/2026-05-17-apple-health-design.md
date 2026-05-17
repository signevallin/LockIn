# Apple Health Integration Design

## Goal

Import steps, total calories burned (active + resting), and workout minutes from Apple Health into LockIn via an Apple Shortcut that syncs three times per day. Display today's progress toward user-defined daily goals on the home page and in a new Hälsa tab inside the Stats page.

## Architecture

An Apple Shortcut installed on the user's iPhone reads three Health metrics for the current day and POSTs them to a Next.js API route (`/api/health/sync`). The route authenticates via a user-specific sync token, then writes the data to Firestore. The app reads back this data in two places: compact chips on the home page and a detailed view with weekly bar charts in Stats → Hälsa.

**Sync schedule:** The user sets up three time-based automations in the Shortcuts app — 08:00, 12:00, and 20:00. Each automation runs the same Shortcut. Every run overwrites `health_data/{today}` with the latest values, so data is always current.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Firebase Firestore, Firebase Admin SDK (for API route token lookup).

---

## Firestore Data Model

Under the top-level collection (not under `users/{uid}`):

```
healthSyncTokens/{token}
  uid: string
  createdAt: Timestamp
```

Under `users/{uid}/`:

```
health_data/{YYYY-MM-DD}
  steps: number
  totalCalories: number        // active + resting (kcal)
  workoutMinutes: number
  syncedAt: Timestamp

health_goals                   // single document
  dailySteps: number           // e.g. 10000
  dailyCalories: number        // e.g. 2500
  healthSyncToken: string      // also stored here for display in setup UI
```

---

## API Route

**`POST /api/health/sync`**

Body (JSON):
```json
{
  "token": "abc123...",
  "steps": 8432,
  "totalCalories": 2140,
  "workoutMinutes": 38,
  "date": "2026-05-17"
}
```

Logic:
1. Read `token` from body. If missing → 400.
2. Look up `healthSyncTokens/{token}` via Firebase Admin SDK. If not found → 401.
3. Write to `users/{uid}/health_data/{date}` with `syncedAt: now()`. Use `setDoc` with merge so re-syncs overwrite cleanly.
4. Return `{ ok: true }`.

**No user session required** — the token is the sole auth mechanism.

---

## Token Setup Flow

The user sets up the integration once from Stats → Hälsa-fliken (before any data exists, this tab shows the setup UI instead of charts).

1. **"Aktivera Apple Health"** button → calls `generateToken()`:
   - Generate a cryptographically random UUID.
   - Write to `healthSyncTokens/{token} = { uid, createdAt }`.
   - Write `token` into `users/{uid}/health_goals.healthSyncToken`.
2. Show the token (copyable) and three numbered instructions:
   - **Steg 1** — "Hämta Shortcut" (button → opens iCloud Shortcut link in new tab)
   - **Steg 2** — "Klistra in din token i Shortcutet när du installerar det"
   - **Steg 3** — "Öppna Shortcuts-appen → Automatisering → skapa tre tidbaserade automationer (08:00, 12:00, 20:00) som kör Shortcutet"
3. **"Testa synk"** button — runs a fetch to `/api/health/sync` with a dummy payload using the token, confirms the route responds with `{ ok: true }`. Shows ✅ or ❌.
4. Once setup is complete (token exists in Firestore), the tab switches to the data view automatically.

The iCloud Shortcut link is a constant stored in `lib/health/shortcut.ts` as `SHORTCUT_URL`. During development this is a placeholder string — the actual `.shortcut` file must be built manually in Apple's Shortcuts app and shared via iCloud before the link can be real. The Shortcut itself reads:
- **Steg (Steps)** — `Health → Steps` for today
- **Totala kalorier** — `Health → Active Energy` + `Health → Resting Energy` for today
- **Träningsminuter** — `Health → Exercise Minutes` for today

Then POSTs all values plus the stored token and today's date to `https://<app-url>/api/health/sync`.

---

## File Structure

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `lib/types.ts` | Add `HealthData`, `HealthGoals` types |
| Create | `lib/health/shortcut.ts` | iCloud Shortcut URL constant |
| Create | `lib/hooks/useHealthData.ts` | Reads `health_data/{today}` from Firestore |
| Create | `lib/hooks/useHealthGoals.ts` | Reads/writes `health_goals` document |
| Create | `app/api/health/sync/route.ts` | API route — token auth + Firestore write |
| Create | `components/health/HealthChips.tsx` | Two chips (steps + calories) on home page |
| Create | `components/health/HealthStats.tsx` | Hälsa tab: today's numbers + weekly chart |
| Create | `components/health/HealthSetup.tsx` | Token generation + Shortcut instructions |
| Create | `components/health/GoalEditor.tsx` | Edit daily step and calorie goals |
| Modify | `app/(app)/app/page.tsx` | Add `<HealthChips />` near top of home page |
| Modify | `app/(app)/app/progress/page.tsx` | Add Fokus/Hälsa toggle, render `HealthStats` or `HealthSetup` |

---

## Component Details

### HealthChips

Shown on the home page when `useHealthGoals` returns a token (i.e. setup is done). If no token exists, renders nothing.

- Two side-by-side cards: steps and total calories
- Each card: large number, label "👟 steg / {goal}" or "🔥 kcal / {goal}", thin progress bar
- Progress bar fills to `min(value / goal, 1) * 100%`
- If today's `health_data` doc hasn't been synced yet, show `—` instead of numbers (no spinner, no error)

### HealthStats

Shown in Stats → Hälsa when setup is complete.

- **Today section**: three metrics (steps, total calories, workout minutes), each with value, progress bar (steps + calories have goals; workout minutes show raw number with "inget mål")
- **Weekly bar chart**: one chart for steps (7 days, today highlighted in a lighter colour). Calories and workout minutes are shown as text under the chart (no separate charts to keep it simple)
- **Footer row**: "Mål: X steg · Y kcal" + "Senast synkat: idag HH:MM" (or "Aldrig" if not synced) + "Ändra mål" button that opens `GoalEditor`

### HealthSetup

Shown in Stats → Hälsa when no `healthSyncToken` exists.

- Title "Koppla Apple Health"
- Explanation paragraph (one sentence)
- "Aktivera" button → generates token → shows instructions
- After activation: token displayed in a monospace copyable box, three numbered steps, "Testa synk" button
- Hides automatically once the first real sync arrives (token exists + health_data for today exists)

### GoalEditor

Modal (uses existing `Modal` component). Two number inputs:
- Dagligt stepmål (default 10 000)
- Dagligt kalorismål (default 2 500)

"Spara" writes to `users/{uid}/health_goals`. Validates both values are positive integers.

---

## Hooks

### `useHealthData(date: string)`

- Subscribes to `users/{uid}/health_data/{date}` via `onSnapshot`
- Returns `{ data: HealthData | null, loading: boolean }`
- `HealthData`: `{ steps, totalCalories, workoutMinutes, syncedAt: Date }`

### `useHealthGoals()`

- Subscribes to `users/{uid}/health_goals` via `onSnapshot`
- Returns `{ goals: HealthGoals | null, loading: boolean, saveGoals, generateToken }`
- `HealthGoals`: `{ dailySteps, dailyCalories, healthSyncToken?: string }`
- `saveGoals(steps: number, calories: number)` — writes to Firestore
- `generateToken()` — generates UUID, writes to `healthSyncTokens` collection and `health_goals.healthSyncToken`

### `useHealthWeek()`

- Fetches last 7 days of `health_data` documents (one `getDocs` on mount, no real-time)
- Returns `{ days: Array<{ date: string, data: HealthData | null }> }`
- Used by `HealthStats` to render the weekly bar chart

---

## Error Handling

- **API route**: returns `{ error: "..." }` with appropriate HTTP status. Never exposes internal Firestore errors to the caller.
- **Token not found**: Shortcut receives 401, which Apple Shortcuts shows as a generic network error. The user can re-check their token in the app.
- **Home page chips**: if `health_data` for today is missing, chips show `—` with no error message. Setup is already done; user just hasn't synced yet today.
- **GoalEditor**: validates inputs client-side before saving. Shows inline error if values are not positive integers.
- **"Testa synk" button**: sends a real POST to `/api/health/sync` with `steps: 0, totalCalories: 0, workoutMinutes: 0` and today's date (a connectivity test, not a data test). Shows Swedish feedback ("✅ Koppling fungerar!" / "❌ Något gick fel — kontrollera din token"). Any zeros written are overwritten on the next real sync.

---

## Types (additions to lib/types.ts)

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
