# Plan för automatiserad morgonrapport

## Översikt
Den dagliga morgonrapporten ska fungera som en kuraterad start på handelsdagen med en snabb recap av gårdagens viktigaste nyheter och rekommenderade fokusområden inför den kommande handeln. Rapporten ska vara AI-genererad men baserad på befintliga datakällor (nyheter, rapporter, marknadspulsen) för att säkerställa konsistens med övriga Market Mind-ytor.

## Mål
1. Skapa en ny Edge Function (`ai-morning-brief`) som körs varje vardagsmorgon kl. 07:00 CET via Vercels cron scheduler.
2. Sammanfatta gårdagens marknadsnyheter, AI-genererade rapporter och marknadspulsen i 3–4 sektioner ("Gårdagens höjdpunkter", "Nyckeltal", "Fokus idag", "Händelser att bevaka").
3. Lagra både rådata och den genererade texten i Supabase för historik, delning och personalisering.
4. Visa den senaste morgonrapporten på `/discover/news`, samt distribuera den via notifieringar (mail/push) till prenumeranter.

## Datakällor
- `fetch-news-data` Edge Function (via `useNewsData`) för gårdagens artiklar, kategorier och sentiment.
- `useDiscoverReportSummaries` för publicerade AI-rapporter under föregående kalenderdag.
- `useMarketData` / `fetch-market-data` för indexrörelser, topp/värsta movers och tidsstämplar.
- Kalendern i `FinancialCalendar` för att lyfta dagens viktigaste möten/rapporter.

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
   - Skapa vy/index för snabb hämtning av senaste rapporten.

3. **Scheduler:**
   - Använd `vercel.json` för att registrera cron-jobb `0 6 * * 1-5` UTC (07:00 CET vintertid, 08:00 sommartid).
   - Cron träffar en Vercel route (`/api/cron/morning-brief`) som i sin tur kallar Supabase Edge Function via service key och loggar status.

## Konsumtion i frontend
1. Ny hook `useMorningBrief` som använder `useQuery` + Supabase RPC för att hämta senaste posten samt refetcha manuellt.
2. Visa rapporten i en ny sektion över rapport-railens highlightkort: hero-subkort med rubrik, "Genererad kl 07:00", textavsnitten och CTA "Läs hela morgonrapporten" som öppnar modal eller leder till dedikerad sida `/morning-brief`.
3. Återanvänd `MarketPulse`-kortet genom att mata in samma data som Edge Function använde för att hålla siffror konsekventa.

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
