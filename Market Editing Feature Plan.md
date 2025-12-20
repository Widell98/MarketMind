# Plan: Lägg till Redigeringsfunktionalitet för Marknader

## Översikt

Lägg till möjlighet för admins att redigera AI-genererad marknadsanalys direkt från `MarketAdminCard`-komponenten i admin-panelen. Redigering ska omfatta sammanfattningstext, positiva påverkanspunkter och negativa påverkanspunkter som visas i `MarketImpactAnalysis`-komponenten.

## Nuvarande Situation

- `MarketAdminCard` visar marknader med toggle-switch för att aktivera/deaktivera
- `MarketImpactAnalysis` hämtar AI-genererad analys via edge function `analyze-prediction-impact`
- Ingen möjlighet att spara eller redigera analysdata
- Ingen databasstruktur för att lagra redigerad marknadsanalys

## Önskat Beteende

1. **Redigeringsknapp**: Visa en "Redigera"-knapp i `MarketAdminCard` för aktiverade marknader
2. **Redigeringsdialog**: Öppna en dialog med formulär för att redigera:
   - Sammanfattningstext (AI-Analys: Marknadseffekt)
   - Positiva påverkanspunkter (lista med name, ticker, reason)
   - Negativa påverkanspunkter (lista med name, ticker, reason)
3. **Databaslagring**: Spara redigerad data i `curated_markets` tabellen
4. **Visning**: `MarketImpactAnalysis` ska visa redigerad data om den finns, annars fallback till AI-genererad analys

## Implementation

### 1. Databas-migration

**Fil:** `supabase/migrations/[timestamp]_add_market_editing_fields.sql`

Lägg till kolumner i `curated_markets` tabellen:
- `ai_summary_text` (TEXT) - Redigerad sammanfattningstext
- `positive_impacts` (JSONB) - Array av positiva påverkanspunkter
- `negative_impacts` (JSONB) - Array av negativa påverkanspunkter
- `updated_at` (TIMESTAMP) - Automatisk uppdateringstid

**Struktur för impacts:**
```json
[
  {
    "name": "Tesla",
    "ticker": "$TSLA",
    "reason": "Beskrivning varför..."
  }
]
```

### 2. Uppdatera MarketAdminCard

**Fil:** `src/pages/AdminStockCases.tsx`

- Lägg till "Redigera"-knapp (endast för `isActive === true`)
- Lägg till Dialog-komponent för redigeringsformulär
- Hämta befintlig redigerad data från `curatedMarkets` query
- Visa redigerad data i formuläret om den finns

**Komponentstruktur:**
```tsx
<MarketAdminCard>
  {/* Befintlig marknadsinfo */}
  {isActive && (
    <Dialog>
      <DialogTrigger>
        <Button>Redigera</Button>
      </DialogTrigger>
      <DialogContent>
        {/* Redigeringsformulär */}
      </DialogContent>
    </Dialog>
  )}
</MarketAdminCard>
```

### 3. Redigeringsformulär

**Fält:**
1. **Sammanfattning** (Textarea)
   - Max 2000 tecken
   - Placeholder: "Skriv eller redigera sammanfattningstexten..."
   - Visa teckenräknare

2. **Positiva påverkanspunkter** (Dynamisk lista)
   - "Lägg till"-knapp
   - För varje item: Name, Ticker (valfritt), Reason
   - "Ta bort"-knapp för varje item

3. **Negativa påverkanspunkter** (Dynamisk lista)
   - Samma struktur som positiva

**Validering:**
- Sammanfattning måste vara minst 10 tecken
- Impact items måste ha name och reason

### 4. Mutation för att spara redigerad data

**Fil:** `src/pages/AdminStockCases.tsx`

Skapa `useMutation` hook:
- Uppdatera `curated_markets` med `ai_summary_text`, `positive_impacts`, `negative_impacts`
- Använd `upsert` med `onConflict: "market_id"`
- Invalidera relevanta queries efter sparning

### 5. Uppdatera MarketImpactAnalysis

**Fil:** `src/components/MarketImpactAnalysis.tsx`

- Lägg till query för att hämta redigerad data från `curated_markets`
- Prioritera redigerad data över AI-genererad analys
- Visa badge "Redigerad av admin" om redigerad data används
- Fallback till AI-genererad analys om ingen redigerad data finns

**Logik:**
```tsx
const { data: curatedData } = useQuery({
  queryKey: ['curated-market-data', market?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('curated_markets')
      .select('ai_summary_text, positive_impacts, negative_impacts')
      .eq('market_id', market.id)
      .eq('is_active', true)
      .single();
    return data;
  }
});

const displaySummary = curatedData?.ai_summary_text || analysis?.summary;
const displayPositive = curatedData?.positive_impacts || analysis?.positive;
const displayNegative = curatedData?.negative_impacts || analysis?.negative;
```

### 6. Uppdatera curatedMarkets query

**Fil:** `src/pages/AdminStockCases.tsx`

Uppdatera `useQuery` för `curatedMarkets` att inkludera:
- `ai_summary_text`
- `positive_impacts`
- `negative_impacts`

## Tekniska Detaljer

### Imports som behövs
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` från `@/components/ui/dialog`
- `Textarea`, `Input`, `Label` från `@/components/ui`
- `Plus`, `X`, `Edit`, `Save` från `lucide-react`
- `useMutation` från `@tanstack/react-query`

### State Management
```tsx
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [editSummary, setEditSummary] = useState('');
const [editPositiveImpacts, setEditPositiveImpacts] = useState<ImpactItem[]>([]);
const [editNegativeImpacts, setEditNegativeImpacts] = useState<ImpactItem[]>([]);
```

### Type Definitions
```tsx
type ImpactItem = {
  name: string;
  ticker?: string;
  reason: string;
};
```

## Filer som kommer att ändras

1. `supabase/migrations/[timestamp]_add_market_editing_fields.sql` (Ny fil)
2. `src/pages/AdminStockCases.tsx` (Uppdatera)
3. `src/components/MarketImpactAnalysis.tsx` (Uppdatera)

## Implementation Order

1. ✅ Skapa databas-migration för redigeringsfält
2. ✅ Uppdatera curatedMarkets query att hämta redigerad data
3. ✅ Skapa mutation hook för att spara redigerad data
4. ✅ Lägg till redigeringsknapp och dialog i MarketAdminCard
5. ✅ Implementera redigeringsformulär med alla fält
6. ✅ Uppdatera MarketImpactAnalysis att använda redigerad data
7. ✅ Testa att redigering fungerar end-to-end

## UX Överväganden

- Redigeringsknappen ska endast visas för aktiverade marknader
- Visa visuell feedback (badge) när marknad har redigerad data
- Bekräfta sparning med toast-notifikation
- Validera input innan sparning
- Visa laddningsindikator under sparning


