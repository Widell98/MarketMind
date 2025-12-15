-- Extend saved_opportunities to support prediction_markets
-- This migration:
-- 1. Updates the item_type constraint to include 'prediction_market'
-- 2. Changes item_id from UUID to TEXT to support Polymarket string IDs

-- First, drop the existing constraint
ALTER TABLE public.saved_opportunities 
  DROP CONSTRAINT IF EXISTS saved_opportunities_item_type_check;

-- Change item_id from UUID to TEXT
-- This will convert existing UUIDs to their text representation
ALTER TABLE public.saved_opportunities 
  ALTER COLUMN item_id TYPE TEXT USING item_id::TEXT;

-- Add the new constraint with prediction_market support
ALTER TABLE public.saved_opportunities 
  ADD CONSTRAINT saved_opportunities_item_type_check 
    CHECK (item_type IN ('stock_case', 'analysis', 'prediction_market'));

-- Note: The unique constraint on (user_id, item_type, item_id) should automatically
-- work with TEXT item_id since PostgreSQL handles the type conversion.
-- If there are issues, the constraint may need to be dropped and recreated manually.

