# Plan för automatiserad morgonrapport

## Översikt
Den dagliga morgonrapporten ska fungera som en kuraterad start på handelsdagen med en snabb recap av gårdagens viktigaste nyheter och rekommenderade fokusområden inför den kommande handeln. Rapporten ska vara AI-genererad men baserad på befintliga datakällor (nyheter, rapporter, marknadspulsen) för att säkerställa konsistens med övriga Market Mind-ytor.

## Mål
1. Skapa en ny Edge Function (`ai-morning-brief`) som körs varje vardagsmorgon kl. 07:00 CET via Vercels cron scheduler.
2. Sammanfatta gårdagens marknadsnyheter, AI-genererade rapporter och marknadspulsen i 3–4 sektioner ("Gårdagens höjdpunkter", "Nyckeltal", "Fokus idag", "Händelser att bevaka").
3. Lagra både rådata och den genererade texten i Supabase för historik, delning och personalisering.
4. Visa den senaste morgonrapporten på `/news`, samt distribuera den via notifieringar (mail/push) till prenumeranter.

## Datakällor
- `fetch-news-data` Edge Function (via `useNewsData`) för gårdagens artiklar, kategorier och sentiment.
- `useDiscoverReportSummaries` för publicerade AI-rapporter under föregående kalenderdag.
- `useMarketData` / `fetch-market-data` för indexrörelser, topp/värsta movers och tidsstämplar.
- Kalendern i `FinancialCalendar` för att lyfta dagens viktigaste möten/rapporter.

## Uppdateringsfrekvens
- `useMarketData` uppdaterar via `fetch-market-data` var 5:e minut (synkat med Edge Functionens cachefönster) för att hålla index och topp-/bottenlistor färska.
- `useNewsData` använder `useSupabaseNewsFeed('news')` med 10 minuters intervall för att matcha `fetch-news-data`-funktionens cacheade nyhetsflöde.
- När båda tidsstämplarna visas i UI:t samlas de under en gemensam "Senast uppdaterad"-indikator så att förändringar i dessa intervall lättare kan härledas.

## Arkitektur
1. **Edge Function `ai-morning-brief`:**
   - Autentiseras via service role key.
   - Hämtar föregående dags nyhets- och rapportdata från Supabase/Edge Functions.
   - Förbereder ett prompt-underlag (JSON) som skickas till OpenAI tillsammans med metadata (volatilitet, sentiment, ekonomiska indikatorer).
   - Returnerar strukturerad JSON med sektionerna:
     ```json
     {
       "generated_at": "2025-02-14T06:00:00Z",
       "headline": "Marknaden återhämtar sig efter inflationstapp",
       "highlights": [ ... ],
       "watchlist": [ ... ],
       "calendar": [ ... ],
       "sentiment": "bullish"
     }
     ```

2. **Persistens:**
   - Spara responsen i tabellen `morning_briefs` (kolumner: `id`, `generated_at`, `payload`, `hash`, `status`).
   - Lägg även till `source_snapshot JSONB` där rådata (toppnyheter, rapportlistor, marknadssiffror) förvaras för transparens och felsökning.
   - Skapa vy/index för snabb hämtning av senaste rapporten.
   - Föreslagen migration (`supabase/migrations`):
     ```sql
     create table if not exists public.morning_briefs (
       id uuid primary key default gen_random_uuid(),
       generated_at timestamptz not null,
       sentiment text check (sentiment in ('bullish','bearish','neutral')),
       payload jsonb not null,
       source_snapshot jsonb not null,
       hash text not null unique,
       status text not null default 'ready',
       created_at timestamptz not null default now()
     );

     create index if not exists morning_briefs_generated_at_idx on public.morning_briefs (generated_at desc);
     ```

3. **Scheduler:**
   - Använd `vercel.json` för att registrera cron-jobb `0 6 * * 1-5` UTC (07:00 CET vintertid, 08:00 sommartid).
   - Cron träffar en Vercel route (`/api/cron/morning-brief`) som i sin tur kallar Supabase Edge Function via service key och loggar status.

4. **Notifieringstrigger:**
   - När funktionen sparar en ny post anropar den `supabase.functions.invoke('notify-subscribers', { type: 'morning_brief', briefId })`.
   - `notify-subscribers` använder Resend för mail och web push via `notification_tokens`-tabellen.

## Konsumtion i frontend
1. Ny hook `useMorningBrief` som använder `useQuery` + Supabase RPC för att hämta senaste posten samt refetcha manuellt.
2. Visa rapporten i en ny sektion över rapport-railens highlightkort: hero-subkort med rubrik, "Genererad kl 07:00", textavsnitten och CTA "Läs hela morgonrapporten" som öppnar modal eller leder till dedikerad sida `/morning-brief`.
3. Återanvänd `MarketPulse`-kortet genom att mata in samma data som Edge Function använde för att hålla siffror konsekventa.
4. Lägg till fallback-banner i `DiscoverNews` som visar "Dagens morgonrapport saknas" om hooken returnerar `status === 'failed'` eller ingen post.

## Steg-för-steg-plan
1. **DB & schema**
   - Lägg till migrationen ovan i `supabase/migrations` och generera typer via `supabase gen types` så `Database['public']['Tables']['morning_briefs']` blir tillgänglig i frontend.
2. **Edge Function (`supabase/functions/ai-morning-brief/index.ts`)**
   - Återanvänd logik från `ai-market-insights` för autentisering.
   - Hämta gårdagens nyheter via `fetch-news-data`, rapporter via `supabase.from('generated_reports')`, samt marknadsdata genom att anropa `fetch-market-data` med service key.
   - Skapa prompt med sektionerna "Gårdagens höjdpunkter", "Nyckeltal", "Fokus idag" och "Händelser att bevaka" och tolka modellens JSON.
   - Spara resultat + `source_snapshot` i `morning_briefs` (med UPSERT på `hash`).
3. **Cron route (`/api/cron/morning-brief.ts`)**
   - Verifiera Vercel Cron-signatur, kalla Supabase Edge Function med service role key och logga svar i `Vercel KV` eller Supabase logg-tabell.
4. **Hook (`src/hooks/useMorningBrief.ts`)**
   - `useQuery(['morning-brief'], fetcher)` som anropar en Supabase RPC eller `supabase.from('morning_briefs').select('*').order('generated_at', { ascending: false }).limit(1)`.
   - Exponera `data`, `isLoading`, `error`, `refetch` samt `status` (ready/failed/pending).
5. **UI (`src/pages/DiscoverNews.tsx`)**
   - Importera `useMorningBrief` och visa nytt kort ovanför rapport-rail: rubrik, genererings-tid, highlights-lista, knappar till full vy.
   - Länka CTA till en modal (`<Dialog>`) eller ny sida `/morning-brief` som återanvänder datan.
   - Passa vidare marknadsdata till `MarketPulse` via befintliga props för konsekventa siffror.
6. **Distribution**
   - Utöka `notify-subscribers` att stödja `morning_brief` payload (ämnesrad, highlights) och trigga web push via `interest_tags` när tillgängligt.

## Distribution och notifieringar
- När Edge Function har sparat en ny rapport, trigga `supabase.functions.invoke('notify-subscribers', { type: 'morning_brief', briefId })`.
- Mail-template i Resend/Supabase: rubrik, topp 3 highlights, knapp till webbsidan.
- Pushnotiser för PWA-användare via web push (lagra tokens i `notification_tokens`).

## Felhantering
- Edge Function loggar och flaggar `status = 'failed'` vid API-fel; cron-route skickar Slack/webhook alert.
- Frontend visar senaste lyckade rapport (även om dagens misslyckades) och banner "Dagens rapport saknas, vi arbetar på att åtgärda".

## Vidareutveckling
- Personalisering: parameter `interest_tags` för att lyfta relevanta branscher per användare.
- Multi-språk (svenska/engelska) genom att be modellen generera två språkversioner i samma payload.
- Historikvy med filter per datum samt export till PDF/Share.
