
-- Add foreign key constraints to saved_opportunities table
ALTER TABLE public.saved_opportunities 
ADD CONSTRAINT fk_saved_opportunities_stock_cases 
FOREIGN KEY (item_id) REFERENCES public.stock_cases(id) ON DELETE CASCADE;

-- Add foreign key constraint for analyses (assuming the analyses table exists)
-- This will help with future queries but won't cause errors if analyses table doesn't exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analyses' AND table_schema = 'public') THEN
        -- Only add the constraint if it doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_saved_opportunities_analyses' 
            AND table_name = 'saved_opportunities'
        ) THEN
            ALTER TABLE public.saved_opportunities 
            ADD CONSTRAINT fk_saved_opportunities_analyses 
            FOREIGN KEY (item_id) REFERENCES public.analyses(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Create index for better performance on item_id lookups
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_item_id ON public.saved_opportunities(item_id);
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_item_type_id ON public.saved_opportunities(item_type, item_id);
