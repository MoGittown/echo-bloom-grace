import { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, ExternalLink, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createCheckoutSession, createPortalSession } from '@/lib/billingApi';
import {
  PLAN_LABELS,
  PLAN_PRICES,
  STATUS_LABELS,
  type BillingSnapshot,
  type SubscriptionPlan,
} from '@/types/billing';

type Props = {
  billing: BillingSnapshot | null;
  studioSlug: string | null | undefined;
  sessionPassword: string;
  onRefresh: () => Promise<unknown>;
};

const UPGRADE_PLANS: SubscriptionPlan[] = ['starter', 'pro'];

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export function BillingPanel({ billing, studioSlug, sessionPassword, onRefresh }: Props) {
  const [loading, setLoading] = useState<'checkout' | 'portal' | 'refresh' | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);

  const status = billing?.subscriptionStatus ?? 'legacy';
  const plan = billing?.plan;
  const trialLabel = formatDate(billing?.trialEndsAt ?? null);
  const graceLabel = formatDate(billing?.billingGraceEndsAt ?? null);

  async function openCheckout(selectedPlan: SubscriptionPlan) {
    if (!studioSlug) {
      toast.error('Bitte zuerst einen Studio-Link (Slug) speichern');
      return;
    }
    setLoading('checkout');
    setCheckoutPlan(selectedPlan);
    const result = await createCheckoutSession({
      password: sessionPassword,
      studioSlug,
      plan: selectedPlan,
    });
    setLoading(null);
    setCheckoutPlan(null);
    if (result.ok) {
      if (result.upgraded) {
        toast.success('Tarif wurde direkt gewechselt.');
        await onRefresh();
        return;
      }
      if (result.url) {
        window.location.href = result.url;
        return;
      }
    }
    const messages: Record<string, string> = {
      price_not_configured: 'Stripe-Preise sind noch nicht konfiguriert.',
      invalid_password: 'Sitzung abgelaufen — bitte neu anmelden.',
      subscription_already_active: 'Tarif wurde bereits gewechselt.',
    };
    toast.error(messages[result.error] ?? 'Checkout fehlgeschlagen');
  }

  async function openPortal() {
    if (!studioSlug) return;
    setLoading('portal');
    const result = await createPortalSession({
      password: sessionPassword,
      studioSlug,
    });
    setLoading(null);
    if (result.ok) {
      window.location.href = result.url;
      return;
    }
    toast.error('Kundenportal konnte nicht geöffnet werden');
  }

  async function handleRefresh() {
    setLoading('refresh');
    await onRefresh();
    setLoading(null);
    toast.success('Abo-Status aktualisiert');
  }

  const needsCheckout = status === 'incomplete' || status === 'canceled' || status === 'unpaid';
  const canManagePortal = billing?.hasStripeCustomer;
  const isLegacy = status === 'legacy';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Abo & Rechnungen
          </CardTitle>
          <CardDescription>
            Zahlung über Stripe · Rechnungen per E-Mail · monatlich kündbar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoRow label="Tarif" value={plan ? `${PLAN_LABELS[plan]} (${PLAN_PRICES[plan]})` : '—'} />
            <InfoRow label="Status" value={STATUS_LABELS[status] ?? status} />
            {billing?.billingEmail && (
              <InfoRow label="Rechnungs-E-Mail" value={billing.billingEmail} />
            )}
            {trialLabel && status === 'trialing' && (
              <InfoRow label="Testphase bis" value={trialLabel} />
            )}
            {billing?.inGracePeriod && graceLabel && (
              <InfoRow label="Check erreichbar bis" value={graceLabel} />
            )}
          </div>

          {billing?.inGracePeriod && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Zahlung überfällig — der Kunden-Check bleibt bis zum <strong>{graceLabel}</strong> aktiv.
              Bitte Zahlungsmethode im Kundenportal aktualisieren.
            </p>
          )}

          {!billing?.hasActiveSubscription && status !== 'legacy' && (
            <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              Der Kunden-Check ist für Endkunden gesperrt, bis das Abo wieder aktiv ist.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading !== null}
              onClick={handleRefresh}
            >
              {loading === 'refresh' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Status aktualisieren
            </Button>
            {canManagePortal && (
              <Button size="sm" disabled={loading !== null} onClick={openPortal}>
                {loading === 'portal' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-1" />
                )}
                Rechnungen & Abo verwalten
              </Button>
            )}
          </div>

          {isLegacy && !canManagePortal && (
            <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
              Sie sind als Bestandskunde eingetragen. Optional können Sie ein Stripe-Abo hinterlegen,
              um Rechnungen und Zahlungen selbst zu verwalten.
            </p>
          )}

          {(needsCheckout || (isLegacy && !canManagePortal)) && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium">
                {needsCheckout ? 'Zahlung abschließen' : 'Abo abschließen'}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {UPGRADE_PLANS.map((p) => (
                  <Button
                    key={p}
                    variant={plan === p ? 'default' : 'outline'}
                    className="h-auto py-3 flex flex-col items-start"
                    disabled={loading !== null}
                    onClick={() => openCheckout(p)}
                  >
                    {loading === 'checkout' && checkoutPlan === p ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span className="font-semibold">{PLAN_LABELS[p]}</span>
                        <span className="text-xs opacity-80">{PLAN_PRICES[p]}</span>
                      </>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {status === 'past_due' && (
            <p className="text-sm text-destructive">
              Die letzte Zahlung ist fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode im
              Kundenportal.
            </p>
          )}

          {canManagePortal && !isLegacy && status !== 'canceled' && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Abo kündigen</p>
              <p className="text-sm text-muted-foreground">
                Ihr Abo ist <strong>monatlich kündbar</strong>. Die Kündigung erledigen Sie selbst und
                jederzeit im Stripe-Kundenportal. Ihr Zugang bleibt bis zum Ende der bereits bezahlten
                Periode aktiv.
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={loading !== null}
                onClick={openPortal}
              >
                {loading === 'portal' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1" />
                )}
                Abo im Kundenportal kündigen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}
