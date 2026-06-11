-- Fix: studio_branding_public lieferte leer, weil security_invoker + RLS "deny all"
-- auf der Basistabelle jede Zeile für anon ausblendet.

ALTER TABLE public.studio_branding
  ADD COLUMN IF NOT EXISTS studio_slug TEXT,
  ADD COLUMN IF NOT EXISTS feature_config JSONB NOT NULL DEFAULT '{
    "steps": {
      "style": true,
      "appliances": true,
      "sink": true,
      "room": true,
      "floorPlan": true,
      "wallView": true,
      "photos": true,
      "contact": true
    },
    "kitchenChat": true,
    "pdfExport": true,
    "protocolEmail": true
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS display_app_name TEXT,
  ADD COLUMN IF NOT EXISTS slogan TEXT,
  ADD COLUMN IF NOT EXISTS logo_white_url TEXT,
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#6B7280',
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#16A34A',
  ADD COLUMN IF NOT EXISTS imprint_url TEXT,
  ADD COLUMN IF NOT EXISTS privacy_url TEXT,
  ADD COLUMN IF NOT EXISTS studio_code TEXT,
  ADD COLUMN IF NOT EXISTS studio_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.studio_branding
SET studio_slug = 'studio-' || substr(id::text, 1, 8)
WHERE studio_slug IS NULL OR studio_slug = '';

DROP VIEW IF EXISTS public.studio_branding_public;

CREATE VIEW public.studio_branding_public
WITH (security_invoker = off) AS
SELECT
  id,
  studio_slug,
  studio_code,
  studio_name,
  display_app_name,
  slogan,
  logo_url,
  logo_white_url,
  primary_color,
  secondary_color,
  accent_color,
  show_default_branding,
  show_landing_page,
  show_appointment_booking,
  show_manufacturer_field,
  landing_headline,
  landing_subheadline,
  landing_benefit_1,
  landing_benefit_2,
  landing_benefit_3,
  landing_cta_text,
  landing_why_text,
  contact_address,
  contact_phone,
  contact_email,
  contact_website,
  imprint_url,
  privacy_url,
  custom_manufacturers,
  enabled_manufacturers,
  feature_config,
  studio_settings,
  created_at,
  updated_at
FROM public.studio_branding;

GRANT SELECT ON public.studio_branding_public TO anon, authenticated;

-- Admin-Passwort zurücksetzen (einmalig: Kuechenready2026!)
UPDATE public.studio_branding
SET admin_password_hash = '$2b$12$qrDvOxqQ9D1WfxxoMnsd3e/g64ro01R9jSXmHo2KKiQA.tyMDZTNC'
WHERE admin_password_hash IS NOT NULL;
