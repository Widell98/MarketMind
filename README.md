# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f3bdb396-b2bb-4755-9f8f-5bc2c9217c55

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f3bdb396-b2bb-4755-9f8f-5bc2c9217c55) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f3bdb396-b2bb-4755-9f8f-5bc2c9217c55) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Running the Supabase Edge Functions locally

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
