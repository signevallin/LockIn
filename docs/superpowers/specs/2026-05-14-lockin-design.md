# LockIn – Designspecifikation
_Datum: 2026-05-14_

## Översikt

LockIn är en accountability-app för att sätta mål, bygga vanor och hålla fokus. Appen riktar sig till användare som vill bryta ner sina drömmar i konkreta dagliga handlingar, hålla sig accountable via löften med ekonomiska insatser, och få stöd av en AI-coach — varje dag.

**Tagline:** Lock in your future.

---

## Plattform

- **Webb + PWA** — körs i webbläsaren, installerbar på hemskärmen via PWA
- Mobilanpassad design (mobile-first), fungerar på dator och mobil
- Inget App Store-konto krävs

---

## Tech Stack

| Del | Teknologi |
|-----|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth + Databas | Firebase (Auth + Firestore) |
| PWA + Push | next-pwa + Firebase Cloud Messaging (FCM) |
| AI-coach | Claude API (claude-sonnet-4-6) via Next.js API-route |
| Schemalagda notiser | Firebase Cloud Functions (kräver Blaze-plan, men praktiskt gratis inom free-tier-gränser) |

---

## Färgpalett

Baserad på Claire McGowan-paletten — varm, jordnära känsla med ljus bakgrund.

| Namn | Hex | Användning |
|------|-----|------------|
| Mother Earth | `#513229` | Primärfärg — knappar, ikoner, text, ring |
| Lucky Dice | `#F4F1E2` | Bakgrund |
| Something Blue | `#D8EBF9` | Accent mål 3 |
| The Bay | `#FCE6B7` | Accent mål 4, info-boxar |
| Walking Vinnie | `#D7D4B1` | Accent mål 2, borders, tomma element |
| Streak-orange | `#e07b39` | Streak-flamma 🔥 |

Typografi: systemfont (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`).

---

## Sidstruktur

```
/                    → Landningssida
/login               → Inloggning / registrering
/app                 → Hem-dashboard (skyddad)
/app/goals           → Mål med delmål (skyddad)
/app/promises        → Löften (skyddad)
/app/focus           → Fokustimer (skyddad)
/app/progress        → Statistik & grafer (skyddad)
/app/coach           → AI-coach (skyddad)
/app/profile         → Profil & inställningar (skyddad)
```

Alla `/app/*`-rutter kräver inloggning — omdirigeras till `/login` om inte autentiserad.

---

## Datastruktur (Firestore)

```
users/{userId}/
  goals/{goalId}
    - title: string
    - category: string              // emoji + namn, t.ex. "💪 Hälsa"
    - deadline: timestamp
    - progress: number              // 0–100
    - createdAt: timestamp

  goals/{goalId}/sub_goals/{subGoalId}
    - title: string
    - completed: boolean
    - completedAt: timestamp | null

  tasks/{taskId}
    - title: string
    - category: string
    - goalId: string | null         // kopplad till mål (valfritt)
    - createdAt: timestamp

  task_completions/{YYYY-MM-DD}/tasks/{taskId}
    - completedAt: timestamp

  focus_sessions/{sessionId}
    - mode: "focus" | "deep_work" | "study" | "custom"
    - durationMinutes: number
    - completedAt: timestamp

  check_ins/{YYYY-MM-DD}
    - mood: 1 | 2 | 3 | 4 | 5      // 1=😔 2=😕 3=😐 4=🙂 5=😄
    - reflection: string            // fritext
    - createdAt: timestamp

  promises/{promiseId}
    - title: string                 // formulerat löfte, t.ex. "Jag lovar att träna 4 ggr/vecka"
    - category: string
    - deadline: timestamp
    - durationDays: number
    - stakeAmount: number           // kr (hedersbaserat)
    - charityOrg: string
    - milestones: array             // auto-genererade delmål med datum
    - status: "active" | "completed" | "broken"
    - createdAt: timestamp

  fcm_token: string                 // FCM push-token för enheten
```

Streak beräknas vid läsning: räkna sammanhängande dagar bakåt från idag där minst en `task_completion` finns.

---

## Funktioner

### 1. Hem-dashboard (`/app`)

- Hälsning med användarnamn
- Dagligt motivationscitat (hårdkodat array, roteras med `day-of-year % antal`)
- **Progress-ring:** andel uppgifter avklarade idag (%)
- **Streak-räknare:** antal dagar i rad med minst en avklarad uppgift
- **XP:** +10 per avklarad uppgift, visas som livstids-total XP (aldrig nollställs)
- **Daglig incheckning:** knapp "Checka in →" synlig tills man checkat in för dagen
  - Modal med humörskala 1–5 (emoji) + fritext-reflektion
  - Sparas i `check_ins/{YYYY-MM-DD}`
  - Efter incheckning: knappen ersätts med humör-emoji + "Incheckad idag ✓"
- **AI-coach-kort:** klickbart kort som leder till `/app/coach`
- **Dagens uppgifter:** lista med checkbox, kategori och streak per uppgift
- Knapp för att lägga till ny uppgift (modal)

### 2. Mål med delmål (`/app/goals`)

- Lista över aktiva mål med progress-bar, deadline och streak
- Klick → detaljvy med delmål som checkboxar
- Progress = `avklarade delmål / totalt antal delmål * 100`
- Formulär för nytt mål: titel, kategori, deadline, initiala delmål
- Arkivering av avslutade mål

### 3. Löften (`/app/promises`)

Tre-stegs-formulär för att skapa ett löfte:

**Steg 1 — Vad lovar du?**
- Fritext: vad lovar du att göra?
- Välj kategori (emoji + namn)

**Steg 2 — Tidplan**
- Deadline (datumväljare)
- Antal dagar (räknas auto från idag → deadline)
- Milstolpar genereras automatiskt: jämnt fördelade kontrollpunkter (t.ex. 25%, 50%, 75%) med datum

**Steg 3 — Insats**
- Belopp i kr (fritext, hedersbaserat — inga riktiga pengar hanteras)
- Välj välgörenhetsorganisation från lista (t.ex. Rädda Barnen, WWF, BRIS, Röda Korset)
- Löftet formuleras automatiskt: _"Jag lovar att [titel]. Om jag inte lyckas innan [datum] skänker jag [belopp] kr till [org]."_

Löfte-listan visar aktiva löften med countdown-timer, milstolpar och insats. Man kan manuellt markera ett löfte som hållet eller brutet.

### 4. Fokustimer (`/app/focus`)

| Läge | Tid |
|------|-----|
| Focus | 25 min |
| Deep Work | 90 min |
| Study | 50 min |
| Custom | Valfri |

- Nedräkning med animerad SVG-ring i `#513229`
- Sessionen loggas i Firestore när timern når 0 (ej vid avbrott)
- `beforeunload`-varning vid aktiv session
- Dagens totala fokustid visas under timern

### 5. AI-coach (`/app/coach`)

En chattgränssnitt med Claude (claude-sonnet-4-6) via en Next.js API-route (`/api/coach`).

**Kontext som skickas till Claude per anrop:**
- Användarens aktiva mål (titel, progress, deadline)
- Aktiva löften (titel, insats, dagar kvar)
- Nuvarande streak
- Humör och reflektion från senaste incheckningen
- De senaste 10 meddelandena i chatten (konversationshistorik)

**System-prompt (på svenska):**
Coachen är direkt, empatisk men ställer jobbiga följdfrågor. Hen håller användaren accountable — inte bara ger beröm. Svarar alltid på svenska. Vet om mål, löften och streak.

**UI:**
- Meddelandebubblar (användare höger, coach vänster)
- Laddningsindikator medan Claude svarar
- Konversationshistorik sparas i `sessionStorage` (rensas när appen stängs — ingen permanent chattlogg)
- Startmeddelande: coachen hälsar och ställer en konkret fråga baserat på användarens data

### 6. Progress & statistik (`/app/progress`)

- Tidsfilter: Vecka / Månad / Totalt
- Nyckeltal: fokustid, avklarade uppgifter, streak, humörsnitt
- Stapeldiagram för daglig aktivitet (fokustid per dag)
- Jämförelse med föregående period (+/- siffror)

### 7. Auth (`/login`)

- Email + lösenord via Firebase Auth
- Registrering och inloggning på samma sida (toggle)
- Omdirigering till `/app` efter lyckad inloggning

### 8. Landningssida (`/`)

- Presentation av appen: features, skärmdumpar, CTA
- Länk till `/login`

---

## Push-notiser (FCM)

Push-notiser skickas via Firebase Cloud Messaging. FCM-token sparas i Firestore när användaren godkänner notiser.

Tre notis-triggers, schemalagda via Firebase Cloud Functions:

| Trigger | Tidpunkt | Villkor |
|---------|----------|---------|
| Daglig incheckning | 20:00 varje dag | Ingen `check_ins/{idag}` finns |
| Streak i fara | 21:00 varje dag | Streak ≥ 2 och ingen `task_completion` idag |
| Milstolpe nådd | Direkt | Promise-milstolpens datum passeras med status "active" |

---

## PWA-konfiguration

- `manifest.json` med appnamn, ikoner och `display: standalone`
- Service worker via `next-pwa` för offline-caching av statiska resurser
- `theme_color: #513229`, `background_color: #F4F1E2`
- FCM service worker registreras parallellt med next-pwa:s service worker

---

## Vad ingår INTE i MVP

- Riktig betalning för insatser (Stripe)
- Delning av mål med vänner / social accountability
- In-app köp eller premium-plan
- Android-specifik native-app
- Mörkt läge
- Permanent sparad chatthistorik med AI-coachen
