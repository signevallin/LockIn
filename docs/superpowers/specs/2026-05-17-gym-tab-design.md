# Gym Tab Implementation Design

## Goal

Replace the "Fokus" tab with a "Gym" tab where the user can create named workout templates, start an active workout session, log multiple sets per exercise with individual weight and reps, and see suggestions for the last used weight on each exercise.

## Architecture

**Navigation:** Remove `/app/focus` (ClockIcon, "Fokus") from BottomNav. Add `/app/gym` with a dumbbell SVG icon and label "Gym".

**Three screens, one page file:**
1. **Template list** — default view, lists saved templates
2. **Active workout** — entered when user taps "Starta" on a template
3. **Modals** — WorkoutTemplateForm (create/edit), ExerciseLibraryModal (pick exercises)

**Firestore data model** under `users/{uid}/`:

```
workoutTemplates/{templateId}
  name: string
  exerciseIds: string[]       // ordered list of exercise IDs (static or custom)
  createdAt: Timestamp

workoutSessions/{sessionId}
  templateId: string
  templateName: string
  date: string                // "YYYY-MM-DD"
  exercises: [
    {
      exerciseId: string
      exerciseName: string
      sets: [{ weight: number, reps: number }]
    }
  ]
  completedAt: Timestamp

customExercises/{exerciseId}
  name: string
  category: string            // "Bröst" | "Ben" | "Rygg" | "Axlar" | "Biceps" | "Triceps" | "Mage"
  type: "machine" | "free_weight" | "bodyweight"
  createdAt: Timestamp
```

**Static exercise library** (`lib/gym/exercises.ts`): ~50 predefined exercises, each with `{ id, name, category, type }`. Categories: Bröst, Ben, Rygg, Axlar, Biceps, Triceps, Mage. Type: `machine` or `free_weight` or `bodyweight`. No separate "Maskiner" category — machines appear under their muscle group with a "Maskin" tag.

**Last weight suggestion:** When the active workout loads, query `workoutSessions` ordered by `completedAt` descending, limit 20. For each exercise in the current workout, find the most recent session containing that exerciseId and extract the last set's weight and reps. Show "💡 Förra gången: Xkg × Y reps" and pre-fill the new set input with those values — but only until the first set is logged. Once at least one set is logged for an exercise in the current session, pre-fill the next set with the values from the most recently logged set in this session instead.

## File Structure

| File | Purpose |
|------|---------|
| `app/(app)/app/gym/page.tsx` | GymPage — orchestrates template list and active workout state |
| `components/gym/WorkoutTemplateList.tsx` | Renders saved templates, "Starta" and edit/delete actions |
| `components/gym/WorkoutTemplateForm.tsx` | Modal: create or edit a template (name + exercises) |
| `components/gym/ActiveWorkout.tsx` | Active workout view — exercise list, set logging, finish |
| `components/gym/ExerciseRow.tsx` | Single exercise: logged sets + new set input with suggestion |
| `components/gym/ExerciseLibraryModal.tsx` | Browse/search/filter exercises, add custom |
| `lib/gym/exercises.ts` | Static exercise library array |
| `lib/hooks/useWorkoutTemplates.ts` | Firestore CRUD hook for workoutTemplates |
| `lib/hooks/useWorkoutSessions.ts` | Firestore read/write hook for workoutSessions |
| `components/layout/BottomNav.tsx` | Replace Fokus with Gym |

## User Flows

### Create a template
1. Tap "+ Ny mall" → WorkoutTemplateForm modal opens
2. Enter name (e.g. "Push-dag")
3. Tap "+ Lägg till övning" → ExerciseLibraryModal
4. Filter by category or search, tap exercise to add
5. Tap "Spara mall" → saved to Firestore, modal closes

### Start a workout
1. Tap "Starta" on a template
2. ActiveWorkout opens with that template's exercises
3. For each exercise: last-session weight pre-fills the input
4. Tap "+ Set" to log a set — saved locally in component state
5. Optionally tap "+ Lägg till övning" to add an exercise not in the template (does not modify the template)
6. Tap "Avsluta pass ✓" → writes workoutSession to Firestore, returns to template list

### Edit a template
Long-press a template card → edit/delete options appear (same pattern as GoalCard).

### Add a custom exercise
Inside ExerciseLibraryModal, tap "+ Skapa egen övning" → inline form: name, category (select), type (select). Saved to `customExercises` in Firestore.

## Component Details

### ExerciseRow
- Shows exercise name + type tag ("Maskin" / "Fri vikt") in muted text
- Renders each logged set as a dark pill: "65kg × 8"
- Shows "💡 Förra gången: Xkg × Y reps" if last-session data exists, otherwise nothing
- New set input: two number fields (kg, reps) pre-filled with suggestion, "+ Set" button
- Tapping a logged set pill opens an edit/delete popover

### ExerciseLibraryModal
- Search input filters by name
- Category filter pills (Alla, Bröst, Ben, Rygg, Axlar, Biceps, Triceps, Mage) — single select
- Exercise list shows name + small type tag
- Tap any exercise to select and close
- "+ Skapa egen övning" at bottom

### WorkoutTemplateList
- Each card: template name, first 3 exercise names + "+N fler", "Starta" pill button
- Long-press → show edit (opens WorkoutTemplateForm pre-filled) and delete
- Empty state: friendly message + "Skapa ditt första pass"

## Data Flow

```
Static exercises (lib/gym/exercises.ts)
       +
Custom exercises (Firestore)
       │
       ▼
ExerciseLibraryModal ──selects──► WorkoutTemplateForm ──saves──► workoutTemplates (Firestore)
                                                                           │
                                        ┌──────────────────────────────────┘
                                        │  user taps Starta
                                        ▼
                              ActiveWorkout (local state)
                                        │
                         reads last weights from workoutSessions
                                        │
                              user logs sets
                                        │
                         "Avsluta pass" ──writes──► workoutSessions (Firestore)
```

## Error Handling

- If Firestore write fails on "Avsluta pass": show a toast error, keep the active workout state so the user doesn't lose data.
- If no previous session found for an exercise: show no suggestion (don't show "0kg").
- Template with no exercises: disable "Starta" button, show "Lägg till övningar först".

## Tech Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS v4
- Firebase Firestore for templates, sessions, custom exercises
- Framer Motion for modal animations (reuse existing Modal component pattern)
- No new dependencies required
