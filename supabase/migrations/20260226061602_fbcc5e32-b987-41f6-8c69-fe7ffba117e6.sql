-- Remove unrestricted write/update/delete policies on studio-assets storage bucket
DROP POLICY IF EXISTS "Allow public uploads to studio-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to studio-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from studio-assets" ON storage.objects;

-- Ensure public read access remains for viewing logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public can view studio assets'
  ) THEN
    CREATE POLICY "Public can view studio assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'studio-assets');
  END IF;
END $$;