# AI-baserad matloggning

## Översikt

Ersätt den befintliga Open Food Facts-sökningen i Kost-fliken med ett AI-drivet fritextflöde. Användaren beskriver vad hen åt, Claude API uppskattar näringsvärden, och användaren väljer portionsstorlek. Måltidskategorier (frukost/lunch/middag/mellanmål) behålls.

---

## Flöde

1. Användaren trycker "+ Lägg till" på en måltidssektion
2. Ett sheet öppnas med ett textfält: *"Vad åt du?"*
3. Användaren skriver t.ex. "kycklingfilé med ris och sallad"
4. Appen anropar `/api/ai/parse-food` med beskrivningen
5. Under anropet visas en laddningsindikator
6. Claude returnerar uppskattade makron per 100g för hela måltiden som en enhet
7. Sheetet visar måltidsnamn + tre portionsknappar: **Liten** (~200g) · **Normal** (~350g) · **Stor** (~500g), plus ett fritextfält för exakt gram
8. Användaren väljer portion → appen beräknar slutliga makron → loggar till Firestore → sheetet stängs

---

## Komponenter

### Modifierad fil: `components/kost/AddFoodSheet.tsx`

Byggs om helt. Befintlig sökning mot Open Food Facts och favoritlogik tas bort. Nytt innehåll:

- Textfält för fri beskrivning
- Laddningstillstånd under API-anrop
- Portionssteg med tre knappar + gram-input
- Felmeddelande om AI-anropet misslyckas: *"Kunde inte tolka måltiden — försök igen"* med en Försök igen-knapp
- "Lägg till"-knapp som bekräftar och loggar

### Ny fil: `app/api/ai/parse-food/route.ts`

`POST /api/ai/parse-food`

Request body:
```json
{ "description": "kycklingfilé med ris och sallad" }
```

Response:
```json
{
  "name": "Kycklingfilé med ris och sallad",
  "kcalPer100g": 145,
  "proteinPer100gG": 14.2,
  "fatPer100gG": 3.1,
  "carbsPer100gG": 15.8
}
```

Anropar Anthropic SDK med en systemprompt som instruerar Claude att uppskatta näringsvärden per 100g för hela måltiden som en sammanslagen enhet. Returnerar strukturerad JSON. Kräver `ANTHROPIC_API_KEY` i miljövariabler.

### Borttagna filer (eller tömd logik)

- Open Food Facts-sökning (`lib/api/openFoodFacts.ts`) — används inte längre
- `useFoodFavorites` hook — används inte längre av AddFoodSheet
- `components/kost/FoodSearchResult.tsx` — tas bort

---

## Datamodell

Oförändrad. Samma Firestore-struktur:

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

`FoodItem` är oförändrad: `{ name, weightG, kcal, proteinG, fatG, carbsG }`.

---

## Felhantering

- **API-timeout eller fel:** Visa "Kunde inte tolka måltiden — försök igen" med retry-knapp
- **Tom beskrivning:** "Lägg till"-knapp inaktiverad tills text finns
- **Saknad API-nyckel:** Servern returnerar 500 med tydligt felmeddelande i loggen

---

## Miljövariabler

Lägg till i `.env.local` och Vercel:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Utanför scope

- Foto-baserad matloggning
- Redigera eller ta bort loggade maträtter
- Streckkodsläsning
- Bevara befintliga favoriter
