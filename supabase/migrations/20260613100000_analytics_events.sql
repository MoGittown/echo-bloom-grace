-- Eigenes, datenschutzfreundliches Funnel- & Fehler-Tracking.
-- Keine personenbezogenen Daten: nur Schritt-/Event-Namen, anonyme Session-ID, Zeitstempel.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  studio_slug TEXT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,            -- 'funnel' | 'conversion' | 'error'
  step TEXT,                           -- Schritt-ID bzw. Event-Name
  platform TEXT,                       -- 'web' | 'app'
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Größenbegrenzungen gegen Missbrauch/Spam
  CONSTRAINT analytics_session_len CHECK (char_length(session_id) <= 64),
  CONSTRAINT analytics_event_type_len CHECK (char_length(event_type) <= 40),
  CONSTRAINT analytics_step_len CHECK (step IS NULL OR char_length(step) <= 80),
  CONSTRAINT analytics_slug_len CHECK (studio_slug IS NULL OR char_length(studio_slug) <= 80),
  CONSTRAINT analytics_platform_len CHECK (platform IS NULL OR char_length(platform) <= 16)
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Clients (anon/authenticated) dürfen NUR einfügen – kein Lesen, kein Ändern, kein Löschen.
DROP POLICY IF EXISTS "anon can insert analytics" ON public.analytics_events;
CREATE POLICY "anon can insert analytics"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Auswertung erfolgt ausschließlich serverseitig über die Edge Function (service_role,
-- umgeht RLS) – daher bewusst KEINE SELECT-Policy.

CREATE INDEX IF NOT EXISTS analytics_events_slug_created_idx
  ON public.analytics_events (studio_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_session_idx
  ON public.analytics_events (session_id);
