import { useState, useCallback } from 'react';
import { BarChart3, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import type { AnalyticsData } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  getAnalytics: () => Promise<AnalyticsData | null>;
};

// Anzeige-Reihenfolge & Labels des Funnels (oben = breitester Trichter)
const FUNNEL_STEPS: Array<{ key: string; label: string }> = [
  { key: 'app_open', label: 'Aufrufe' },
  { key: 'check_started', label: 'Check gestartet' },
  { key: 'step:style', label: 'Stil' },
  { key: 'step:appliances', label: 'Geräte' },
  { key: 'step:sink', label: 'Spüle' },
  { key: 'step:room', label: 'Raum' },
  { key: 'step:floorPlan', label: 'Grundriss' },
  { key: 'step:wallView', label: 'Wände' },
  { key: 'step:photos', label: 'Fotos' },
  { key: 'step:contact', label: 'Kontakt' },
  { key: 'step:summary', label: 'Übersicht' },
  { key: 'chat_used', label: 'KI-Berater genutzt' },
];

const CONVERSIONS: Array<{ key: string; label: string }> = [
  { key: 'protocol_sent', label: 'Protokoll gesendet' },
  { key: 'pdf_downloaded', label: 'PDF heruntergeladen' },
  { key: 'csv_downloaded', label: 'CSV heruntergeladen' },
];

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function AnalyticsPanel({ getAnalytics }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getAnalytics();
    setData(result);
    setLoaded(true);
    setLoading(false);
  }, [getAnalytics]);

  const maxFunnel = data
    ? Math.max(1, ...FUNNEL_STEPS.map((s) => data.funnel[s.key] ?? 0))
    : 1;
  const visibleFunnel = data
    ? FUNNEL_STEPS.filter((s) => (data.funnel[s.key] ?? 0) > 0)
    : [];

  const protocolSent = data?.conversions['protocol_sent'] ?? 0;
  const conversionRate = data && data.sessions > 0
    ? Math.round((protocolSent / data.sessions) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />Funnel & Nutzung
        </CardTitle>
        <CardDescription>
          Anonyme Auswertung der letzten {data?.rangeDays ?? 30} Tage – wo steigen Besucher ein und wo brechen sie ab.
          Keine personenbezogenen Daten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {loaded ? 'Aktualisieren' : 'Statistik laden'}
        </Button>

        {loaded && !data && (
          <p className="text-sm text-muted-foreground">Konnte nicht geladen werden. Bitte erneut versuchen.</p>
        )}

        {data && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Sitzungen" value={data.sessions} />
              <Stat label="Protokolle" value={protocolSent} />
              <Stat label="Conversion" value={`${conversionRate}%`} />
            </div>

            {data.sessions === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Daten. Sobald jemand den Check über deinen Studio-Link öffnet, erscheinen hier die Zahlen.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Funnel (Sitzungen pro Schritt)</p>
                {visibleFunnel.map((s) => {
                  const count = data.funnel[s.key] ?? 0;
                  const pct = Math.round((count / maxFunnel) * 100);
                  return (
                    <div key={s.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{s.label}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded">
                        <div className="h-full bg-primary rounded" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Aktionen</p>
              <div className="grid grid-cols-3 gap-3">
                {CONVERSIONS.map((c) => (
                  <Stat key={c.key} label={c.label} value={data.conversions[c.key] ?? 0} small />
                ))}
              </div>
            </div>

            {data.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1 text-destructive">
                  <AlertTriangle className="w-4 h-4" />Letzte Fehler
                </p>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {data.errors.map((e, i) => (
                    <div key={i} className="text-xs border rounded p-2 bg-muted/40">
                      <div className="flex justify-between">
                        <span className="font-medium">{e.context}</span>
                        <span className="text-muted-foreground">{formatDateTime(e.at)}</span>
                      </div>
                      {e.message && <p className="text-muted-foreground mt-1 break-words">{e.message}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className={small ? 'text-lg font-semibold' : 'text-2xl font-bold'}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
