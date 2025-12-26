# MarketMind

MarketMind är en plattform för investeringsanalys och portföljhantering med AI-stöd.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI GPT models
- **Deployment**: Vercel

## Projektstruktur

```
src/
├── components/     # React komponenter
├── hooks/          # Custom React hooks
├── pages/          # Route komponenter
├── contexts/       # React contexts (Auth, Language, etc.)
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── config/         # Konfiguration (env, etc.)
└── integrations/   # Externa integrations (Supabase, etc.)
```

## Environment Setup

Before running the application, you need to configure environment variables:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   - `VITE_SUPABASE_URL` - Your Supabase project URL (found in Project Settings > API)
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key (found in Project Settings > API)

3. The `.env` file is automatically ignored by git and will not be committed.

**Important:** The application will use fallback values in development mode if these variables are not set, but you should always configure them properly for production.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or bun
- Supabase account and project

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

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
4. Confirm that the frontend points to the same Supabase project by verifying the URL and anon key in your `.env` file (see Environment Setup above).
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

## Testing

Projektet använder Vitest och React Testing Library för tester.

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Code Quality

### Linting

```bash
npm run lint
```

### TypeScript

TypeScript strict mode är aktiverat. Kör type checking med:

```bash
npx tsc --noEmit
```

## Contributing

Se [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) för guidelines och best practices.

## Deployment

Applikationen är konfigurerad för deployment på Vercel. Se `vercel.json` för konfiguration.

För deployment behöver du sätta environment variables i Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## License

Private project
