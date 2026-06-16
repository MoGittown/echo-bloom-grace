-- Plattform-Betreiber-Sicht (Business-View)
-- 1) Boolean-Flag: markiert ein Studio als Plattform-Betreiber. KEIN Studio wird
--    hier auf true gesetzt – der Betreiber markiert sein eigenes Studio später
--    manuell per SQL (siehe Zusammenfassung / TODO).
-- 2) subscribed_at + current_period_end: für die Betreiber-Übersicht
--    ("abonniert seit" / "nächste Verlängerung"). Werden vom Stripe-Webhook
--    gepflegt (syncSubscriptionToStudio).

ALTER TABLE public.studio_branding
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

COMMENT ON COLUMN public.studio_branding.is_platform_admin IS
  'true = dieses Studio sieht zusätzlich die Plattform-Betreiber-Übersicht. Manuell per SQL setzen.';
COMMENT ON COLUMN public.studio_branding.subscribed_at IS
  'Zeitpunkt, ab dem das Abo erstmals aktiv/trialing wurde ("abonniert seit").';
COMMENT ON COLUMN public.studio_branding.current_period_end IS
  'Ende der aktuellen Abrechnungsperiode (nächste Verlängerung) – aus Stripe gepflegt.';
