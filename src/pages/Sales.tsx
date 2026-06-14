import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Copy, KeyRound, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createSalesCheckout } from '@/lib/billingApi';
import { slugifyStudioName } from '@/lib/studioSlug';

const BRAND = '#2E7D32';
const SALES_KEY_STORAGE = 'kuechenready_sales_key';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_sales_key: 'Vertriebs-Schlüssel ungültig.',
  price_id_required: 'Stripe Price ID erforderlich (price_…).',
  studio_not_found: 'Studio nicht gefunden.',
  studio_name_required: 'Firmenname erforderlich.',
  email_required: 'Gültige E-Mail erforderlich.',
  password_too_short: 'Admin-Passwort mindestens 8 Zeichen.',
  invalid_slug: 'Ungültiger Studio-Link.',
  registration_failed: 'Studio konnte nicht angelegt werden.',
};

export default function SalesPage() {
  const [salesKey, setSalesKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [priceId, setPriceId] = useState('');
  const [existingSlug, setExistingSlug] = useState('');
  const [studioName, setStudioName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [studioSlug, setStudioSlug] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSlug, setResultSlug] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SALES_KEY_STORAGE);
    if (stored) {
      setSalesKey(stored);
      setAuthenticated(true);
    }
  }, []);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!salesKey.trim()) return;
    sessionStorage.setItem(SALES_KEY_STORAGE, salesKey.trim());
    setAuthenticated(true);
    toast.success('Vertriebs-Zugang aktiv');
  }

  async function handleCreateExisting(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResultUrl(null);
    const res = await createSalesCheckout({
      salesKey,
      priceId: priceId.trim(),
      existingStudioSlug: existingSlug.trim(),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(ERROR_MESSAGES[res.error] ?? 'Fehler beim Erzeugen des Links');
      if (res.error === 'invalid_sales_key') setAuthenticated(false);
      return;
    }
    setResultSlug(res.studioSlug);
    if (res.upgraded) {
      toast.success(`Premium für „${res.studioSlug}" direkt aktiviert.`);
      return;
    }
    setResultUrl(res.url);
    toast.success('Zahlungslink erstellt');
  }

  async function handleCreateNew(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResultUrl(null);
    const res = await createSalesCheckout({
      salesKey,
      priceId: priceId.trim(),
      studioName: studioName.trim(),
      billingEmail: billingEmail.trim(),
      password,
      studioSlug: studioSlug.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(ERROR_MESSAGES[res.error] ?? 'Fehler beim Erzeugen des Links');
      if (res.error === 'invalid_sales_key') setAuthenticated(false);
      return;
    }
    setResultSlug(res.studioSlug);
    if (res.upgraded) {
      toast.success(`Premium für „${res.studioSlug}" aktiviert.`);
      return;
    }
    setResultUrl(res.url);
    toast.success('Studio angelegt — Zahlungslink bereit');
  }

  async function copyUrl() {
    if (!resultUrl) return;
    await navigator.clipboard.writeText(resultUrl);
    toast.success('Link kopiert');
  }

  const slugPreview = studioSlug.trim()
    ? slugifyStudioName(studioSlug)
    : slugifyStudioName(studioName);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <KeyRound className="w-10 h-10 mx-auto mb-2 text-slate-500" />
            <CardTitle>Vertrieb — Premium</CardTitle>
            <CardDescription>Interner Zugang mit Vertriebs-Schlüssel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label>Vertriebs-Schlüssel</Label>
                <Input
                  type="password"
                  value={salesKey}
                  onChange={(e) => setSalesKey(e.target.value)}
                  placeholder="SALES_API_KEY"
                  required
                />
              </div>
              <Button type="submit" className="w-full text-white" style={{ backgroundColor: BRAND }}>
                Freischalten
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-2xl">
          <Link to="/fuer-studios" className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Marketing
          </Link>
          <span className="text-sm font-medium" style={{ color: BRAND }}>Vertrieb · Premium</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Premium-Zahlungslink
            </CardTitle>
            <CardDescription>
              Individueller Stripe-Preis (`price_…`) · Link an Kunden senden · kein Self-Service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Stripe Price ID *</Label>
              <Input
                value={priceId}
                onChange={(e) => setPriceId(e.target.value)}
                placeholder="price_… (individueller Premium-Preis)"
                required
              />
              <p className="text-xs text-muted-foreground">
                Im Stripe Dashboard unter Produkte → Premium → Preis anlegen und ID kopieren.
              </p>
            </div>

            <Tabs defaultValue="existing">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Bestehendes Studio</TabsTrigger>
                <TabsTrigger value="new">Neues Studio</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="mt-4">
                <form onSubmit={handleCreateExisting} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Studio-Slug *</Label>
                    <Input
                      value={existingSlug}
                      onChange={(e) => setExistingSlug(e.target.value)}
                      placeholder="kuechen-mueller"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full text-white" style={{ backgroundColor: BRAND }}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Zahlungslink erstellen
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="new" className="mt-4">
                <form onSubmit={handleCreateNew} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Firmenname *</Label>
                    <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Rechnungs-E-Mail *</Label>
                    <Input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin-Passwort *</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Studio-Link (optional)</Label>
                    <Input value={studioSlug} onChange={(e) => setStudioSlug(e.target.value)} placeholder="kuechen-mueller" />
                    {slugPreview && (
                      <p className="text-xs text-muted-foreground font-mono">/{slugPreview}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full text-white" style={{ backgroundColor: BRAND }}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Building2 className="w-4 h-4 mr-2" />}
                    Studio anlegen & Link erstellen
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {resultUrl && resultSlug && (
              <div className="rounded-lg border bg-white p-4 space-y-3">
                <p className="text-sm font-medium">Zahlungslink für <span className="font-mono">{resultSlug}</span></p>
                <Input readOnly value={resultUrl} className="font-mono text-xs" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyUrl}>
                    <Copy className="w-4 h-4 mr-1" /> Kopieren
                  </Button>
                  <Button size="sm" asChild>
                    <a href={resultUrl} target="_blank" rel="noreferrer">Öffnen</a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nach Zahlung: Kunde meldet sich unter /admin mit Studio-Slug und Passwort an.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
