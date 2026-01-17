-- Add INSERT policy for studio-assets bucket to allow uploads
CREATE POLICY "Allow public uploads to studio-assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'studio-assets');

-- Add UPDATE policy for updating/replacing files
CREATE POLICY "Allow public updates to studio-assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'studio-assets')
WITH CHECK (bucket_id = 'studio-assets');

-- Add DELETE policy for removing old logos
CREATE POLICY "Allow public deletes from studio-assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'studio-assets');