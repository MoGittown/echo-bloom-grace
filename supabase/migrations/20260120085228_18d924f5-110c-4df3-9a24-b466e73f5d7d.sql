-- Add enabled_manufacturers column to store which standard manufacturers are shown
ALTER TABLE public.studio_branding 
ADD COLUMN enabled_manufacturers text[] DEFAULT '{}'::text[];