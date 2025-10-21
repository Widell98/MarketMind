# Plan: Integrate Weekly AI Case Generation into Discover Page

## 1. Current State Analysis
- The `generate-weekly-cases` Supabase Edge Function (`supabase/functions/generate-weekly-cases/index.ts`) already composes prompts for OpenAI, generates three stock cases, and inserts them into the `stock_cases` table as `ai_generated` entries with `is_public` and `status` defaults.【F:supabase/functions/generate-weekly-cases/index.ts†L1-L120】
- Database migrations schedule the Edge Function to run twice weekly, but there is no visibility or manual trigger in the UI to confirm runs or backfill missing cases.【F:supabase/migrations/20250721220751-608473ef-1b5f-4aad-a641-7a4987a32b3b.sql†L1-L22】
- The Discover page (`src/pages/Discover.tsx`) lists public stock cases, but it lacks dedicated surfacing of AI-generated batches or telemetry about the scheduled job.【F:src/pages/Discover.tsx†L1-L156】
- `AIWeeklyPicks` (`src/components/AIWeeklyPicks.tsx`) filters the latest cases heuristically for "AI" keywords instead of relying on the `ai_generated` flag and is not currently mounted on the Discover page.【F:src/components/AIWeeklyPicks.tsx†L1-L120】

## 2. Objectives
1. Ensure weekly AI generation runs reliably and can be monitored or triggered on demand.
2. Surface the most recent AI-generated cases prominently within `/discover`.
3. Provide graceful fallbacks when the Edge Function fails or produces fewer cases than expected.

## 3. Implementation Steps

### 3.1 Backend & Scheduling
- **Parameterize generation batches:** Extend the Edge Function to stamp each generated case with a shared `ai_batch_id` (e.g., timestamp UUID) and persist execution metadata (batch id, run time, success count) in a lightweight `ai_generation_runs` table for observability.
- **Retry & validation guardrails:** Add defensive checks for malformed JSON, enforce numeric conversions for price fields, and skip duplicates by comparing `(title, company_name)` against recent AI batches before insert.
- **Scheduler hygiene:** Verify the Supabase scheduled job exists in production and add environment docs for required keys (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Optionally expose a protected HTTP endpoint or Supabase RPC to trigger the Edge Function manually for admins when a batch is missing.

### 3.2 Database & Types
- **Schema additions:** Create `ai_generation_runs` table with columns like `id`, `status`, `generated_count`, `error_message`, `triggered_by`, `created_at`. Index `stock_cases.ai_generated` for faster filtering on read.
- **Type updates:** Extend `StockCase` TypeScript interface with optional `ai_batch_id` and `generated_at` fields to match new columns. Update Supabase Row Level Security to allow inserts from the Edge Function service role while keeping public reads restricted to `is_public=true`.

### 3.3 Frontend Integration on `/discover`
- **Hook enhancements:** Update `useLatestStockCases` and `useStockCases` to accept filter options (`aiGeneratedOnly`, `limit`) and to request `ai_batch_id` and `created_at`. Use the dedicated flag rather than keyword heuristics.【F:src/hooks/useLatestStockCases.ts†L1-L120】【F:src/hooks/useStockCases.ts†L1-L120】
- **Component update:** Refactor `AIWeeklyPicks` to:
  - Consume the enhanced hook with `aiGeneratedOnly=true` and limit to the latest batch.
  - Display batch metadata (run date, number of ideas) and handle loading/empty/error states tied to the new observability table.
  - Provide a "Regenerate" button only for authenticated admins, invoking the Edge Function via `supabase.functions.invoke('generate-weekly-cases')` and showing toast feedback.
- **Discover page placement:** Import and mount `AIWeeklyPicks` near the top of `Discover.tsx`, ahead of the search/filter panel, so weekly AI ideas are visible before community submissions. Wrap it in a feature flag or check for available AI cases to avoid empty sections.

### 3.4 Monitoring & UX
- **Toast & logging:** Reuse the existing toast system to surface generation errors. Log front-end invocation results with `console.info` for debugging.
- **Fallback messaging:** If no AI batch is present, show informative copy inviting users to check back later and optionally trigger a manual generation (admin only).
- **Analytics hooks:** Optionally instrument button clicks with existing analytics (if available) to measure engagement with AI picks.

## 4. Validation Checklist
- Automated tests (or manual QA) confirm that invoking the Edge Function inserts AI-tagged cases and that the Discover page reflects the new entries.
- Scheduled job logs show successful completion twice per week; manual trigger respects auth.
- Discover page renders without regressions when no AI cases exist, and the new components meet performance expectations.
