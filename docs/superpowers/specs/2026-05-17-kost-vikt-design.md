# Kost & Vikt Feature Design

## Overview

Replace the Coach tab with a **Kost** tab for daily food logging, and add a **Vikt** tab to the Stats screen. Food intake from Kost feeds into the Vikt analysis. Body weight is pulled from Apple Health via the existing Shortcut sync.

---

## 1. Navigation Change

**Remove** the Coach tab from the bottom navigation bar. The AI chat remains accessible from the home screen (existing entry point).

**Add** a Kost tab to the bottom nav in its place (icon: 🍽 or a fork/plate icon). Position: where Coach currently sits.

Bottom nav order (after change): **Hem · Kost · Träning · Stats**

---

## 2. Kost Tab

### 2.1 Screen Structure

The Kost tab shows one day at a time (today by default). A date picker at the top allows navigating to past days.

**Daily summary chips** (row of 4 at the top):
- kcal total
- protein (g)
- fett (g)
- kolhydrater (g)

Summed from all logged food items for the selected day.

**Four meal sections**, each expandable/collapsible:
- 🌅 Frukost
- ☀️ Lunch
- 🌙 Middag
- 🍎 Mellanmål

Each meal section shows:
- Meal name + total kcal for that meal
- List of logged food items (name, weight, kcal)
- "+ Lägg till" button

### 2.2 Food Logging Flow

Tapping "+ Lägg till" on a meal opens a sheet/modal:

1. **Search field** — queries Open Food Facts API (`https://world.openfoodfacts.org/cgi/search.pl?action=process&json=true&search_terms={query}`)
2. **Mina favoriter** section — shows saved favorite foods (from Firestore)
3. **Sökresultat** section — live results from Open Food Facts

Each food item in results shows: name, kcal/100g, protein/fett/kolhydrater per 100g.

Tapping a result opens a detail view:
- Food name
- Weight input (grams, default 100g)
- Calculated kcal/protein/fett/kolh for the entered weight
- "Lägg till i [meal]" button
- "Spara som favorit" toggle

### 2.3 Data Model (Firestore)

**Food log entry**: `users/{uid}/food_log/{date}/meals/{mealId}/items/{itemId}`

```
{
  name: string,           // "Kycklingfilé"
  weightG: number,        // 200
  kcal: number,           // calculated
  proteinG: number,
  fatG: number,
  carbsG: number,
  addedAt: Timestamp
}
```

Alternatively, flatten to: `users/{uid}/food_log/{date}` as a single document with a nested structure (meals array). **Use flat document per date** to minimise reads:

```
users/{uid}/food_log/{YYYY-MM-DD}: {
  meals: {
    frukost: FoodItem[],
    lunch: FoodItem[],
    middag: FoodItem[],
    mellanmal: FoodItem[]
  }
}
```

Where `FoodItem = { name, weightG, kcal, proteinG, fatG, carbsG }`.

**Favorites**: `users/{uid}/food_favorites/{itemId}`

```
{
  name: string,
  kcalPer100g: number,
  proteinPer100gG: number,
  fatPer100gG: number,
  carbsPer100gG: number,
  lastUsedAt: Timestamp
}
```

Favorites are sorted by `lastUsedAt` descending.

### 2.4 Open Food Facts API

Endpoint: `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=true&search_terms={query}&fields=product_name,nutriments&page_size=10`

Key fields from response:
- `product.product_name`
- `product.nutriments.energy-kcal_100g`
- `product.nutriments.proteins_100g`
- `product.nutriments.fat_100g`
- `product.nutriments.carbohydrates_100g`

Search is called client-side (no API key required). Debounce 400ms. Show skeleton loaders while fetching. If search returns no results or API fails, show "Inga resultat — prova att söka på engelska".

---

## 3. Vikt Tab in Stats

The Stats screen currently has two tabs: Fokus and Hälsa. Add a third: **Vikt**.

### 3.1 Data Sources

- **Burned kcal per day**: from `users/{uid}/health_data/{date}.totalCalories` (Apple Health via Shortcut)
- **Consumed kcal per day**: sum of all kcal from `users/{uid}/food_log/{date}` across all meals
- **Body weight per day**: from `users/{uid}/health_data/{date}.weight` (new field, Apple Health via extended Shortcut)

### 3.2 Vikt Tab Sections

#### Section A: Förbränning vs Intag · 7 dagar (grouped bar chart)

A grouped bar chart showing the last 7 days (Mon–today). For each day, two side-by-side bars:
- Dark brown bar: totalCalories (burned)
- Yellow bar: consumed kcal (from food log)

Today's bars are rendered at 50% opacity (day not complete). X-axis: Mån/Tis/Ons/.../Idag. No Y-axis labels (relative heights sufficient). Legend: Förbrukat (brown) / Intaget (yellow).

#### Section B: Denna vecka · Energibalans

Three numbers in a row:
- **Förbrända kcal** — sum of `totalCalories` for Mon–today
- **−**
- **Intagna kcal** — sum of food log kcal for Mon–today
- **=**
- **Underskott/Överskott** — the difference (green if positive underskott, red if överskott)

#### Section C: Denna vecka · Vikt

Two columns separated by a vertical divider:

Left: **Förväntat** — `(weeklyDeficit / 7700)` formatted as `−X.XX kg` or `+X.XX kg`
- Sub-label: `(1 400 kcal ÷ 7 700)` (shows the week's actual numbers)

Right: **Utfall vs förra veckan** — latest weight from Apple Health this week minus latest weight from last week
- Sub-label: `från Apple Hälsa`

If no weight data from Apple Health: show `—`.

#### Section D: Plan vs Utfall · 10 veckor (line chart)

SVG line chart spanning 10+ weeks:
- **Dashed line** — the plan: starts at the user's starting weight (earliest recorded weight), decreases by `weeklyDeficit / 7700` per week
- **Yellow dots + solid line** — actual recorded weekly weights (average or latest weight per week from Apple Health data)
- Latest actual point highlighted with a larger filled circle
- Future weeks on plan line shown faded

X-axis: week numbers (v10, v11, ..., nu, v18, v19 faded). Y-axis: weight in kg (3–4 labels).

Plan baseline: use the earliest weight entry found in Firestore as starting point, or fall back to a user-configured starting weight (stored in `users/{uid}/health_goals/goals.startWeight`).

### 3.3 Weight in Apple Health Sync

Extend `/api/health/sync` to accept an optional `weight` field (kg, number). If present, store it alongside steps/calories in `users/{uid}/health_data/{date}`.

The Apple Shortcut is extended manually by the user to also query "Lichaamsgewicht" / "Kroppsvikt" from HealthKit and include it in the POST body.

Updated sync payload shape:
```json
{
  "date": "2026-05-17",
  "steps": 8432,
  "totalCalories": 2045,
  "workoutMinutes": 45,
  "weight": 72.4
}
```

Weight is optional — existing syncs without weight continue to work.

---

## 4. Architecture

### New Files

| File | Purpose |
|------|---------|
| `app/(app)/app/kost/page.tsx` | Kost tab main screen |
| `components/kost/MealSection.tsx` | Single meal card with food item list |
| `components/kost/AddFoodSheet.tsx` | Bottom sheet: search + favorites + add |
| `components/kost/DailyNutritionChips.tsx` | Row of 4 summary chips |
| `components/kost/FoodSearchResult.tsx` | Single search result row |
| `components/stats/ViktTab.tsx` | Full Vikt tab content |
| `components/stats/BurnedVsConsumedChart.tsx` | Grouped bar chart (Section A) |
| `components/stats/PlanVsActualChart.tsx` | Line chart (Section D) |
| `lib/hooks/useFoodLog.ts` | Read/write food log for a date |
| `lib/hooks/useFoodFavorites.ts` | Read/write favorites |
| `lib/hooks/useWeeklyNutrition.ts` | Aggregate food log kcal for 7 days |
| `lib/hooks/useWeightHistory.ts` | Fetch weight entries from health_data for 10+ weeks |
| `lib/api/openFoodFacts.ts` | Typed wrapper for Open Food Facts search |
| `lib/types.ts` | Extend with FoodItem, FoodLogDay, FoodFavorite types |

### Modified Files

| File | Change |
|------|--------|
| `app/(app)/app/layout.tsx` or nav component | Replace Coach tab with Kost tab |
| `app/(app)/app/progress/page.tsx` | Add Vikt as third tab in Stats toggle |
| `app/api/health/sync/route.ts` | Accept optional `weight` field, store it |
| `lib/hooks/useHealthData.ts` | Expose `weight?: number` from snapshot |
| `lib/types.ts` | Add `weight?: number` to HealthData |

### Data Flow

```
Kost tab → useFoodLog → Firestore food_log
AddFoodSheet → lib/api/openFoodFacts → Open Food Facts API
AddFoodSheet → useFoodFavorites → Firestore food_favorites

Vikt tab (Section A+B) → useWeeklyNutrition (food_log 7 days) + useHealthWeek (health_data 7 days)
Vikt tab (Section C+D) → useWeightHistory (health_data 10+ weeks)

Apple Shortcut → POST /api/health/sync with weight → health_data/{date}
```

---

## 5. Error Handling

- Open Food Facts API timeout/failure: show inline error "Kunde inte hämta sökresultat" with retry button
- No food logged for a day: show empty state per meal ("Inget loggat — tryck + för att lägga till")
- No weight data from Apple Health: show `—` in weight section with hint "Synka din vikt via Genvägen"
- Partial week data (some days missing health or food data): treat missing days as 0 for bar chart bars, skip them for line chart

---

## 6. Out of Scope

- Editing or deleting logged food items (v1: log-only, no edit)
- Custom food entries not in Open Food Facts
- Barcode scanning
- Calorie goals / macro targets
- Historical food log browsing beyond the date picker
