
The portfolio features rely on two Supabase Edge Functions: `update-portfolio-prices` (reads Google Sheets prices and updates holdings) and `list-sheet-tickers` (exposes the tickers available in the sheet). To avoid "Failed to send a request to the Edge Function" errors during local development:

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you have not already.
2. Start the functions you need, for example:
   ```bash
   supabase functions serve update-portfolio-prices
   supabase functions serve list-sheet-tickers
   ```
   Each command runs the function on `http://localhost:54321/functions/v1/<function-name>`.
3. Make sure the environment variables below are available to both functions (e.g. via a `.env` file or the Supabase dashboard):
   - `GOOGLE_SERVICE_ACCOUNT` – JSON credentials for a service account with Google Sheets read access.
   - `GOOGLE_SHEET_ID` – The spreadsheet ID that holds the ticker and price data.
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` – Needed by `update-portfolio-prices` to update the database.
4. Confirm that the frontend points to the same Supabase project by verifying the URL and anon key configured in `src/integrations/supabase/client.ts`.
5. You can manually test that the functions respond by running:
   ```bash
   curl -i --request POST \
     'https://<your-project>.supabase.co/functions/v1/list-sheet-tickers' \
     --header 'Authorization: Bearer <anon-or-service-role-key>'
   ```
   Replace the URL and token with your project details. A successful response contains `{ "success": true, "tickers": [...] }`.

If any of these steps fail the UI will surface helpful diagnostics (for example in the “Lägg till innehav” dialog) explaining what needs to be fixed.

### Real-time research with Tavily

Questions that require färska nyheter eller rapporter triggar nu en sökning via [Tavily](https://tavily.com/). För att detta ska fungera i Edge-funktionen `portfolio-ai-chat` behöver du ange API-nyckeln i miljön:

- `TAVILY_API_KEY` – hittas i Tavily-konsolen och används för realtidssökningen.

När nyckeln finns tillgänglig kommer funktionen automatiskt att hämta sökresultat och skicka med dem till språkmodellen när användaren ställer frågor som t.ex. "Hur såg Teslas senaste rapport ut?".
