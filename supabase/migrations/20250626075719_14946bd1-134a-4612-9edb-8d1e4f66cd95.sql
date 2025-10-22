
-- Remove existing policies first
DROP POLICY IF EXISTS "Anyone can view stock case images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload stock case images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own stock case images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own stock case images" ON storage.objects;

-- Delete and recreate the bucket
DELETE FROM storage.buckets WHERE id = 'stock-case-images';

-- Create the stock-case-images storage bucket with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stock-case-images',
  'stock-case-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create storage policies for the bucket
CREATE POLICY "Anyone can view stock case images" ON storage.objects
FOR SELECT USING (bucket_id = 'stock-case-images');

CREATE POLICY "Authenticated users can upload stock case images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'stock-case-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own stock case images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'stock-case-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'stock-case-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own stock case images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'stock-case-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
