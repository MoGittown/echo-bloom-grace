-- Add custom_manufacturers column to studio_branding for storing studio-specific manufacturers
ALTER TABLE public.studio_branding 
ADD COLUMN custom_manufacturers text[] DEFAULT '{}'::text[];