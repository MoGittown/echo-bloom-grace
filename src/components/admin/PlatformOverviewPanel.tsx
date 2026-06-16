import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Euro, Loader2, RefreshCw, TimerReset, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchPlatformOverview, type PlatformStudio } from '@/lib/billingApi';
import {
  PLAN_LABELS,
  PLAN_MONTHLY_EUR,
  STATUS_LABELS,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '@/types/billing';

type Props = {
  studioSlug: string | null | undefined;
  sessionPassword: string;
};

const ACTIVE_STATUSES = new Set<SubscriptionStatus>(['active', 'trialing', 'legacy']);

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function planLabel(plan: SubscriptionPlan | null): string {
  if (!plan) return '—';
  return PLAN_LABELS[plan] ?? plan;
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status as SubscriptionStatus] ?? status;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
    case 'legacy':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'trialing':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'past_due':
    case 'unpaid':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'canceled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function PlatformOverviewPanel({ studioSlug, sessionPassword }: Props) {
  const [studios, setStudios] = useState<PlatformStudio[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studioSlug) return;
    setLoading(true);
    setError(null);
    const result = await fetchPlatformOverview({ password: sessionPassword, studioSlug });
    setLoading(false);
    if (result.ok) {
      setStudios(result.studios);
    } else {
      const messages: Record<string, string> = {
        not_platform_admin: 'Dieses Studio ist nicht als Plattform-Betreiber freigeschaltet.',
        invalid_password: 'Sitzung abgelaufen — bitte neu anmelden.',
      };
      setError(messages[result.error] ?? 'Übersicht konnte nicht geladen werden.');
    }
  }, [studioSlug, sessionPassword]);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = useMemo(() => {
    const list = studios ?? [];
    let activeSubs = 0;
    let trials = 0;
    let canceled = 0;
    let mrr = 0;
    for (const s of list) {
      const status = s.subscriptionStatus as SubscriptionStatus;
      if (status === 'trialing') trials += 1;
      if (status === 'canceled') canceled += 1;
      if (status === 'active' || status === 'trialing') {
        activeSubs += 1;
        const price = s.plan ? PLAN_MONTHLY_EUR[s.plan] : null;
        if (status === 'active' && price) mrr += price;
      }
    }
    return { activeSubs, trials, canceled, mrr, total: list.length };
  }, [studios]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Plattform-Übersicht
              </CardTitle>
              <CardDescription>
                Alle Küchenstudios und ihr Abo-Status auf einen Blick.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled={loading} onClick={load}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              icon={<Users className="w-4 h-4" />}
              label="Aktive Abos"
              value={String(metrics.activeSubs)}
              hint={`von ${metrics.total} Studios`}
            />
            <MetricCard
              icon={<Euro className="w-4 h-4" />}
              label="MRR"
              value={`${metrics.mrr.toLocaleString('de-DE')} €`}
              hint="aus Starter/Pro · Premium individuell"
            />
            <MetricCard
              icon={<TimerReset className="w-4 h-4" />}
              label="Testphasen"
              value={String(metrics.trials)}
            />
            <MetricCard
              icon={<XCircle className="w-4 h-4" />}
              label="Gekündigt"
              value={String(metrics.canceled)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              {error}
            </p>
          )}

          {loading && !studios && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Lade Studios…
            </div>
          )}

          {studios && studios.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Studio</th>
                    <th className="px-3 py-2 font-medium">Slug</th>
                    <th className="px-3 py-2 font-medium">Tarif</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Abonniert seit</th>
                    <th className="px-3 py-2 font-medium">Trial-Ende</th>
                    <th className="px-3 py-2 font-medium">Nächste Verlängerung</th>
                    <th className="px-3 py-2 font-medium">Rechnungs-E-Mail</th>
                  </tr>
                </thead>
                <tbody>
                  {studios.map((s, i) => (
                    <tr key={s.studioSlug ?? i} className="border-t">
                      <td className="px-3 py-2 font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                          {s.studioName}
                          {s.isPlatformAdmin && (
                            <span className="text-[10px] uppercase tracking-wide text-primary border border-primary/30 rounded px-1 py-0.5">
                              Betreiber
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{s.studioSlug ?? '—'}</td>
                      <td className="px-3 py-2">{planLabel(s.plan)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs ${statusBadgeClass(
                            s.subscriptionStatus,
                          )}`}
                        >
                          {statusLabel(s.subscriptionStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(s.subscribedAt)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(s.trialEndsAt)}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDate(s.currentPeriodEnd)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground break-all">
                        {s.billingEmail ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {studios && studios.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">Noch keine Studios vorhanden.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
