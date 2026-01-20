-- Add show_manufacturer_field column to studio_branding
ALTER TABLE public.studio_branding 
ADD COLUMN show_manufacturer_field boolean DEFAULT true;