-- Multi-Studio SaaS: öffentlicher Slug + Checklisten-Feature-Toggles
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
  }'::jsonb;

-- Bestehende Studios: Slug aus ID
UPDATE public.studio_branding
SET studio_slug = 'studio-' || substr(id::text, 1, 8)
WHERE studio_slug IS NULL OR studio_slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS studio_branding_studio_slug_idx
  ON public.studio_branding (studio_slug);

-- Public View neu aufsetzen (neue Spalten)
DROP VIEW IF EXISTS public.studio_branding_public;

CREATE VIEW public.studio_branding_public
WITH (security_invoker = on) AS
SELECT
  id,
  studio_slug,
  studio_name,
  logo_url,
  primary_color,
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
  custom_manufacturers,
  enabled_manufacturers,
  feature_config,
  created_at,
  updated_at
FROM public.studio_branding;

GRANT SELECT ON public.studio_branding_public TO anon, authenticated;
