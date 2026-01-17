-- Create branding settings table (single-tenant: one row)
CREATE TABLE public.studio_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  admin_password_hash TEXT NOT NULL,
  primary_color TEXT DEFAULT '#8B7355',
  show_default_branding BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_branding ENABLE ROW LEVEL SECURITY;

-- Public can read branding (for displaying to end users)
CREATE POLICY "Anyone can read branding"
ON public.studio_branding
FOR SELECT
USING (true);

-- No direct insert/update from client - managed via edge function with password check

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-assets', 'studio-assets', true);

-- Allow public read access to studio assets
CREATE POLICY "Public can view studio assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'studio-assets');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_studio_branding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_studio_branding_timestamp
BEFORE UPDATE ON public.studio_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_studio_branding_updated_at();