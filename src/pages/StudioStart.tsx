import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Check, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerAndCheckout } from '@/lib/billingApi';
import { slugifyStudioName } from '@/lib/studioSlug';
import {
  PLAN_LABELS,
  PLAN_PRICES,
  type SubscriptionPlan,
} from '@/types/billing';

const BRAND = '#2E7D32';
const WEB_ORIGIN = import.meta.env.VITE_PUBLIC_WEB_URL || 'https://kuechenready.de';

const ERROR_MESSAGES: Record<string, string> = {
  studio_name_required: 'Bitte Firmenname eingeben.',
  email_required: 'Bitte gültige E-Mail-Adresse eingeben.',
  password_too_short: 'Passwort mindestens 8 Zeichen.',
  reserved_slug: 'Dieser Link-Name ist reserviert — bitte anderen wählen.',
  invalid_slug: 'Ungültiger Link-Name.',
  price_not_configured: 'Tarif derzeit nicht verfügbar — bitte später erneut versuchen.',
  registration_failed: 'Registrierung fehlgeschlagen — bitte erneut versuchen.',
  invalid_plan: 'Ungültiger Tarif.',
};

function parsePlan(raw: string | null): SubscriptionPlan | null {
  if (raw === 'starter' || raw === 'pro') return raw;
  return null;
}

export default function StudioStart() {
  const [params] = useSearchParams();
  const plan = parsePlan(params.get('plan')) ?? 'pro';
  const canceled = params.get('billing') === 'cancel';

  const [studioName, setStudioName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [studioSlug, setStudioSlug] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const slugPreview = useMemo(() => {
    const base = studioSlug.trim()
      ? slugifyStudioName(studioSlug)
      : slugifyStudioName(studioName);
    return base ? `${WEB_ORIGIN.replace(/\/$/, '')}/${base}` : '';
  }, [studioName, studioSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Passwort mindestens 8 Zeichen');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    if (!accepted) {
      toast.error('Bitte Nutzungsbedingungen bestätigen');
      return;
    }

    setSubmitting(true);
    const result = await registerAndCheckout({
      studioName: studioName.trim(),
      billingEmail: billingEmail.trim(),
      password,
      plan,
      studioSlug: studioSlug.trim() || undefined,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(ERROR_MESSAGES[result.error] ?? 'Fehler bei der Registrierung');
      return;
    }

    sessionStorage.setItem('kuechenready_admin_studio_slug', result.studioSlug);
    window.location.href = result.url;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-lg">
          <Link
            to="/fuer-studios#preise"
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Link>
          <span className="text-sm font-medium text-slate-500">Küchenready</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-lg">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="text-center pb-2">
            <div
              className="mx-auto mb-3 p-3 rounded-full w-fit"
              style={{ backgroundColor: `${BRAND}18` }}
            >
              <Building2 className="w-8 h-8" style={{ color: BRAND }} />
            </div>
            <CardTitle className="font-display text-2xl">Studio starten</CardTitle>
            <CardDescription>
              Tarif <strong>{PLAN_LABELS[plan]}</strong> · {PLAN_PRICES[plan]} · 14 Tage Testphase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canceled && (
              <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Checkout abgebrochen. Sie können es jederzeit erneut versuchen.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studioName">Firmenname *</Label>
                <Input
                  id="studioName"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="Küchenstudio Müller"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingEmail">E-Mail für Rechnungen *</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="office@mein-studio.de"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studioSlug">Wunsch-Link (optional)</Label>
                <Input
                  id="studioSlug"
                  value={studioSlug}
                  onChange={(e) => setStudioSlug(e.target.value)}
                  placeholder="kuechen-mueller"
                />
                {slugPreview && (
                  <p className="text-xs text-muted-foreground">
                    Ihr Kunden-Link: <span className="font-mono">{slugPreview}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Admin-Passwort *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <label className="flex gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Ich akzeptiere die{' '}
                  <a href="/fuer-studios" className="underline" target="_blank" rel="noreferrer">
                    Nutzungsbedingungen
                  </a>{' '}
                  und starte ein monatlich kündbares Abo nach der Testphase.
                </span>
              </label>

              <Button
                type="submit"
                className="w-full text-white"
                disabled={submitting}
                style={{ backgroundColor: BRAND }}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Weiter zur Zahlung
              </Button>
            </form>

            <p className="mt-6 flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BRAND }} />
              Sichere Zahlung über Stripe · Rechnungen automatisch per E-Mail · DSGVO-konform (EU)
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
