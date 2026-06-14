-- Grace Period bei Zahlungsausfall (Phase 3)
ALTER TABLE public.studio_branding
  ADD COLUMN IF NOT EXISTS billing_grace_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN public.studio_branding.billing_grace_ends_at IS
  'Bis zu diesem Zeitpunkt bleibt der Check bei past_due noch erreichbar (Standard: 7 Tage).';

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
  plan,
  subscription_status,
  billing_grace_ends_at,
  created_at,
  updated_at
FROM public.studio_branding;

GRANT SELECT ON public.studio_branding_public TO anon, authenticated;
