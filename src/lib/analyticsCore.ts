// Reine Analytics-Logik (ohne Supabase/DOM-Importe) – isoliert testbar.

const SESSION_KEY = 'kr_analytics_sid';

export type AnalyticsEventType = 'funnel' | 'conversion' | 'error';

export interface AnalyticsRow {
  studio_slug: string | null;
  session_id: string;
  event_type: AnalyticsEventType;
  step: string | null;
  platform: string;
  metadata: Record<string, unknown>;
}

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stabile, anonyme Session-ID für die aktuelle Browser-Sitzung. */
export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = randomId();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    // sessionStorage nicht verfügbar (z. B. Privacy-Modus) – pro Aufruf neue ID
    return randomId();
  }
}

/** Baut eine Event-Zeile (rein, ohne Seiteneffekt) – erleichtert Tests. */
export function buildAnalyticsRow(
  eventType: AnalyticsEventType,
  step: string | null,
  studioSlug: string | null | undefined,
  metadata: Record<string, unknown> = {},
  sessionId: string = getSessionId(),
): AnalyticsRow {
  return {
    studio_slug: studioSlug ?? null,
    session_id: sessionId,
    event_type: eventType,
    step: step ? String(step).slice(0, 80) : null,
    platform: 'web',
    metadata,
  };
}
