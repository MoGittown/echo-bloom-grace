ALTER TABLE public.studio_branding
  ADD COLUMN IF NOT EXISTS studio_slug TEXT,
  ADD COLUMN IF NOT EXISTS feature_config JSONB NOT NULL DEFAULT '{"steps":{"style":true,"appliances":true,"sink":true,"room":true,"floorPlan":true,"wallView":true,"photos":true,"contact":true},"kitchenChat":true,"pdfExport":true,"protocolEmail":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS display_app_name TEXT,
  ADD COLUMN IF NOT EXISTS slogan TEXT,
  ADD COLUMN IF NOT EXISTS imprint_url TEXT,
  ADD COLUMN IF NOT EXISTS privacy_url TEXT,
  ADD COLUMN IF NOT EXISTS studio_code TEXT,
  ADD COLUMN IF NOT EXISTS studio_settings JSONB NOT NULL DEFAULT '{}'::jsonb;