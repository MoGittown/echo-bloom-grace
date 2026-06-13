import { supabase } from '@/integrations/supabase/client';
import { buildAnalyticsRow, type AnalyticsRow } from '@/lib/analyticsCore';

// Datenschutzfreundliches First-Party-Tracking:
// - keine Cookies, keine personenbezogenen Daten
// - anonyme Session-ID nur im sessionStorage (pro Browser-Tab/Sitzung)
// - Inserts sind "fire-and-forget" und dürfen die UX nie blockieren

export type { AnalyticsEventType, AnalyticsRow } from '@/lib/analyticsCore';
export { getSessionId, buildAnalyticsRow } from '@/lib/analyticsCore';

async function send(row: AnalyticsRow): Promise<void> {
  try {
    await supabase.from('analytics_events' as never).insert(row as never);
  } catch {
    // Analytics darf niemals die App stören.
  }
}

/** Funnel-Schritt (z. B. 'check_started', 'step:room', 'chat_used'). */
export function trackFunnel(step: string, studioSlug?: string | null): void {
  void send(buildAnalyticsRow('funnel', step, studioSlug));
}

/** Conversion (z. B. 'protocol_sent', 'pdf_downloaded', 'csv_downloaded'). */
export function trackConversion(
  name: string,
  studioSlug?: string | null,
  metadata: Record<string, unknown> = {},
): void {
  void send(buildAnalyticsRow('conversion', name, studioSlug, metadata));
}

/** Fehler (Kontext + gekürzte Meldung, keine Stacktraces mit Daten). */
export function trackError(context: string, message?: string, studioSlug?: string | null): void {
  void send(
    buildAnalyticsRow('error', context, studioSlug, {
      message: (message || '').slice(0, 200),
    }),
  );
}
