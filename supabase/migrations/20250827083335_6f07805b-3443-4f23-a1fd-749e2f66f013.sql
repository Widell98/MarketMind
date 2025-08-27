-- Add target_reached and stop_loss_hit columns to stock_cases
ALTER TABLE public.stock_cases
ADD COLUMN IF NOT EXISTS target_reached boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS stop_loss_hit boolean NOT NULL DEFAULT false;

-- Ensure both flags cannot be true at the same time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stock_cases_status_exclusive'
  ) THEN
    ALTER TABLE public.stock_cases
    ADD CONSTRAINT stock_cases_status_exclusive
    CHECK (NOT (target_reached AND stop_loss_hit));
  END IF;
END $$;