-- Abo & Stripe-Billing (Phase 1)
-- Bestehende Studios bleiben über subscription_status = 'legacy' aktiv.

ALTER TABLE public.studio_branding
  ADD COLUMN IF NOT EXISTS plan TEXT
    CHECK (plan IS NULL OR plan IN ('starter', 'pro', 'premium')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'legacy'
    CHECK (subscription_status IN (
      'legacy', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'paused'
    )),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_email TEXT;

UPDATE public.studio_branding
SET subscription_status = 'legacy'
WHERE subscription_status IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS studio_branding_stripe_customer_id_idx
  ON public.studio_branding (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS studio_branding_stripe_subscription_id_idx
  ON public.studio_branding (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.studio_branding.plan IS 'Tarif: starter | pro | premium';
COMMENT ON COLUMN public.studio_branding.subscription_status IS 'Stripe-Abo-Status; legacy = Bestandskunde ohne Stripe';
COMMENT ON COLUMN public.studio_branding.stripe_customer_id IS 'Stripe Customer ID (nur serverseitig)';
COMMENT ON COLUMN public.studio_branding.stripe_subscription_id IS 'Stripe Subscription ID (nur serverseitig)';
