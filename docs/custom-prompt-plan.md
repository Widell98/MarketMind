# Plan: Anpassad prompt för rapportgenerering i Admin Dashboard

## Översikt
Lägg till möjlighet att skriva in en egen prompt i `/admin-dashboard` när man genererar rapporter. Om en anpassad prompt anges ska den användas istället för standardprompten.

## Nuvarande flöde
1. Användaren laddar upp ett dokument i `AIGenerationAdminControls`
2. Klickar på "Generera rapportsammanfattning"
3. Frontend anropar `generate-report-summary` edge function
4. Edge function bygger standardprompt via `buildPrompt()` (rad 290-385 i `generate-report-summary/index.ts`)
5. Prompt skickas till OpenAI API

## Förändringar som behövs

### 1. Frontend - AIGenerationAdminControls.tsx
**Fil:** `src/components/AIGenerationAdminControls.tsx`

**Ändringar:**
- Lägg till ett state för anpassad prompt: `const [customPrompt, setCustomPrompt] = useState<string>('');`
- Lägg till ett `Textarea`-fält i UI där användaren kan skriva sin egen prompt
- Placera textfältet mellan dokumentuppladdningen och "Generera"-knappen
- Uppdatera `handleGenerateReport` för att skicka med `customPrompt` i request body
- Lägg till en checkbox eller toggle för att aktivera/deaktivera anpassad prompt (valfritt, men rekommenderat)

**UI-placering:**
- Efter dokumentinfo-sektionen (rad ~485)
- Före "Generera rapportsammanfattning"-knappen (rad ~489)

### 2. Backend - generate-report-summary/index.ts
**Fil:** `supabase/functions/generate-report-summary/index.ts`

**Ändringar:**
- Uppdatera `GenerateReportSummaryPayload` type för att inkludera `custom_prompt?: string | null;` (rad 11-20)
- I `serve`-funktionen, kontrollera om `payload.custom_prompt` finns och är icke-tom
- Om anpassad prompt finns:
  - Använd den direkt istället för att anropa `buildPrompt()`
  - Lägg fortfarande till rapportinnehållet (sourceContent) i prompten, men använd användarens prompt som huvudinstruktion
  - Format: `{customPrompt}\n\nUNDERLAG (${sourceDescriptor}):\n"""\n${reportContent}\n"""`

**Logik:**
```typescript
let finalPrompt: string;
if (payload.custom_prompt?.trim()) {
  // Använd anpassad prompt
  finalPrompt = `${payload.custom_prompt.trim()}\n\nUNDERLAG (${sourceDescriptor}):\n"""\n${truncateContent(sourceContent)}\n"""`;
} else {
  // Använd standardprompt
  finalPrompt = buildPrompt(truncateContent(sourceContent), sourceDescriptor, {
    companyHint,
    reportTitleHint,
  });
}
```

### 3. UI/UX-förbättringar (rekommenderat)
- Lägg till en "Återställ till standard" knapp för att rensa anpassad prompt
- Lägg till en "Visa standardprompt" knapp/länk så användaren kan se vad standardprompten innehåller
- Lägg till hjälptext som förklarar att om anpassad prompt används, kommer standardprompten att ignoreras helt
- Validering: Varning om anpassad prompt är tom när användaren försöker generera

## Implementeringssteg

### Steg 1: Uppdatera Frontend UI
1. Öppna `src/components/AIGenerationAdminControls.tsx`
2. Lägg till state för custom prompt
3. Lägg till Textarea-komponent i UI
4. Uppdatera `handleGenerateReport` för att inkludera custom prompt i request

### Steg 2: Uppdatera Backend
1. Öppna `supabase/functions/generate-report-summary/index.ts`
2. Uppdatera `GenerateReportSummaryPayload` type
3. Lägg till logik för att hantera anpassad prompt
4. Testa att både standard och anpassad prompt fungerar

### Steg 3: Testning
1. Testa med standardprompt (ingen anpassad prompt)
2. Testa med anpassad prompt
3. Testa med tom anpassad prompt (ska använda standard)
4. Testa med whitespace-only prompt (ska använda standard)

## Exempel på användning

### Scenario 1: Standardprompt (ingen förändring)
- Användaren laddar upp dokument
- Klickar "Generera"
- Standardprompt används

### Scenario 2: Anpassad prompt
- Användaren laddar upp dokument
- Skriver in egen prompt: "Analysera rapporten och fokusera särskilt på kassaflöde och framtidsutsikter. Presentera resultatet på engelska."
- Klickar "Generera"
- Anpassad prompt används, standardprompt ignoreras

## Tekniska detaljer

### Payload-struktur
```typescript
{
  source_type: 'document',
  source_document_name: '...',
  source_document_id: '...',
  source_content: '...',
  created_by: '...',
  custom_prompt?: string | null  // NYTT FÄLT
}
```

### Prompt-format med anpassad prompt
```
{användarens_prompt}

UNDERLAG (från dokumentet {dokumentnamn}):
"""
{rapportinnehåll}
"""
```

## Säkerhetsöverväganden
- Ingen extra säkerhetsvalidering behövs eftersom endast admins har tillgång till denna funktion
- Överväg att begränsa längden på anpassad prompt (t.ex. max 2000 tecken) för att undvika för stora requests

## Ytterligare förbättringar (framtida)
- Spara anpassade prompts som templates
- Historik över använda prompts
- Dela prompts mellan admins
- Förhandsgranska hur prompten kommer att se ut med dokumentinnehållet

