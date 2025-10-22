
-- Create table for stock case image history
CREATE TABLE public.stock_case_image_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_case_id UUID NOT NULL REFERENCES public.stock_cases(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_current BOOLEAN NOT NULL DEFAULT false
);

-- Create index for better performance
CREATE INDEX idx_stock_case_image_history_case_id ON public.stock_case_image_history(stock_case_id);
CREATE INDEX idx_stock_case_image_history_current ON public.stock_case_image_history(stock_case_id, is_current);

-- Enable RLS
ALTER TABLE public.stock_case_image_history ENABLE ROW LEVEL SECURITY;

-- Create policies for image history
CREATE POLICY "Anyone can view image history for public cases" 
  ON public.stock_case_image_history 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_cases 
      WHERE id = stock_case_image_history.stock_case_id 
      AND is_public = true
    )
  );

CREATE POLICY "Authenticated users can add image history" 
  ON public.stock_case_image_history 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own image history or admins can update any" 
  ON public.stock_case_image_history 
  FOR UPDATE 
  USING (
    auth.uid() = created_by 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger to ensure only one current image per stock case
CREATE OR REPLACE FUNCTION ensure_single_current_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this image as current, unset all others for this stock case
  IF NEW.is_current = true THEN
    UPDATE public.stock_case_image_history 
    SET is_current = false 
    WHERE stock_case_id = NEW.stock_case_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_current_image
  BEFORE INSERT OR UPDATE ON public.stock_case_image_history
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_current_image();
