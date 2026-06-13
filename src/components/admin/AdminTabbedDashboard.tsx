import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, ChefHat, Copy, Globe, Image as ImageIcon,
  Link2, Loader2, LogOut, Palette, QrCode, Save, Trash2, Upload,
} from 'lucide-react';
import type { BrandingData } from '@/hooks/useBranding';
import type { BrandingUpdates } from '@/lib/brandingApi';
import { MANUFACTURER_CATEGORIES } from '@/constants/manufacturerCategories';
import {
  DEFAULT_FEATURE_CONFIG,
  WIZARD_STEP_LABELS,
  type FeatureConfig,
} from '@/types/featureConfig';
import { DEFAULT_STUDIO_SETTINGS, type StudioSettings } from '@/types/studioSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DsgvoChecklist } from '@/components/admin/DsgvoChecklist';
import { AnalyticsPanel } from '@/components/admin/AnalyticsPanel';
import type { AnalyticsData } from '@/hooks/useBranding';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLOR_PRESETS = ['#8B7355', '#C2410C', '#2E7D32', '#1D4ED8', '#7C3AED', '#BE123C', '#0F766E', '#374151'];
const WEB_ORIGIN = import.meta.env.VITE_PUBLIC_WEB_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const APP_SCHEME = import.meta.env.VITE_APP_DEEP_LINK_SCHEME || 'kuechencheck';

type Props = {
  branding: BrandingData;
  updateBranding: (updates: BrandingUpdates) => Promise<boolean>;
  uploadLogo: (file: File) => Promise<string | null>;
  changePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  getAnalytics: () => Promise<AnalyticsData | null>;
  logout: () => void;
};

export function AdminTabbedDashboard({ branding, updateBranding, uploadLogo, changePassword, getAnalytics, logout }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen haben');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    setChangingPassword(true);
    const result = await changePassword(newPassword);
    setChangingPassword(false);
    if (result.ok) {
      toast.success('Passwort geändert');
      setNewPassword('');
      setConfirmPassword('');
    } else if (result.error === 'password_too_short') {
      toast.error('Passwort muss mindestens 8 Zeichen haben');
    } else {
      toast.error('Passwort konnte nicht geändert werden');
    }
  }

  const [form, setForm] = useState(() => initForm(branding));

  useEffect(() => {
    setForm(initForm(branding));
  }, [branding]);

  const customerUrl = branding.studioSlug ? `${WEB_ORIGIN}/s/${branding.studioSlug}` : '';
  const checkUrl = customerUrl ? `${customerUrl}/check` : '';
  const deepLink = branding.studioSlug ? `${APP_SCHEME}://studio/${branding.studioSlug}` : '';

  async function save(updates: BrandingUpdates, successMsg = 'Gespeichert') {
    setSaving(true);
    const ok = await updateBranding(updates);
    setSaving(false);
    if (ok) toast.success(successMsg);
    else toast.error('Speichern fehlgeschlagen');
    return ok;
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte Bilddatei wählen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max. 5 MB');
      return;
    }
    setUploading(true);
    const url = await uploadLogo(file);
    setUploading(false);
    if (url) toast.success('Logo hochgeladen');
    else toast.error('Upload fehlgeschlagen');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="w-10 h-10 object-contain" />
            ) : (
              <div className="p-2 bg-primary/10 rounded-lg">
                <ChefHat className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="font-semibold">Studio-Admin</h1>
              <p className="text-xs text-muted-foreground">
                {branding.displayAppName || branding.studioName} — gilt für Web & App
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={customerUrl || '/'}>
              <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Vorschau</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Tabs defaultValue="general">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="general">Grunddaten</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="features">Check & Funktionen</TabsTrigger>
            <TabsTrigger value="catalog">Hersteller</TabsTrigger>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="legal">Recht</TabsTrigger>
            <TabsTrigger value="landing">Landing</TabsTrigger>
            <TabsTrigger value="link">Link & QR</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="security">Sicherheit</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Studio-Informationen</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Firmenname" value={form.studioName} onChange={(v) => setForm({ ...form, studioName: v })} />
                <Field label="Anzeigename in App/Web" value={form.displayAppName} onChange={(v) => setForm({ ...form, displayAppName: v })} />
                <Field label="Slogan / Claim" value={form.slogan} onChange={(v) => setForm({ ...form, slogan: v })} />
                <Field label="Studio-Link (Slug)" value={form.studioSlug} onChange={(v) => setForm({ ...form, studioSlug: v })} hint="z. B. kuechen-mueller" />
                <Field label="Studio-Code" value={form.studioCode} onChange={(v) => setForm({ ...form, studioCode: v })} hint="z. B. MUEL-2026" />
                <Field label="Adresse" value={form.contact.address || ''} onChange={(v) => setForm({ ...form, contact: { ...form.contact, address: v } })} />
                <Field label="Telefon" value={form.contact.phone || ''} onChange={(v) => setForm({ ...form, contact: { ...form.contact, phone: v } })} />
                <Field label="E-Mail (Protokoll & Support)" value={form.contact.email || ''} onChange={(v) => setForm({ ...form, contact: { ...form.contact, email: v } })} />
                <Field label="Website" value={form.contact.website || ''} onChange={(v) => setForm({ ...form, contact: { ...form.contact, website: v } })} />
                <SaveButton saving={saving} onClick={() => save({
                  studioName: form.studioName,
                  displayAppName: form.displayAppName,
                  slogan: form.slogan,
                  studioSlug: form.studioSlug,
                  studioCode: form.studioCode,
                  contact: form.contact,
                })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5" />Logo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {branding.logoUrl && (
                  <img src={branding.logoUrl} alt="Logo" className="h-20 object-contain" />
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <div className="flex gap-2">
                  <Button variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Logo hochladen
                  </Button>
                  <Button variant="ghost" disabled={saving} onClick={() => save({ removeLogo: true }, 'Logo entfernt')}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Field label="Logo-URL (weiß / dunkler Hintergrund)" value={form.logoWhiteUrl || ''} onChange={(v) => setForm({ ...form, logoWhiteUrl: v })} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Farben</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <ColorField label="Primärfarbe" value={form.primaryColor} onChange={(v) => setForm({ ...form, primaryColor: v })} />
                <ColorField label="Sekundärfarbe" value={form.secondaryColor} onChange={(v) => setForm({ ...form, secondaryColor: v })} />
                <ColorField label="Akzentfarbe" value={form.accentColor} onChange={(v) => setForm({ ...form, accentColor: v })} />
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button key={c} type="button" className="w-8 h-8 rounded-full border" style={{ background: c }} onClick={() => setForm({ ...form, primaryColor: c })} />
                  ))}
                </div>
                <TextField label="Onboarding-Text" value={form.studioSettings.content.onboardingText} onChange={(v) => setForm({
                  ...form,
                  studioSettings: { ...form.studioSettings, content: { ...form.studioSettings.content, onboardingText: v } },
                })} />
                <SaveButton saving={saving} onClick={() => save({
                  primaryColor: form.primaryColor,
                  secondaryColor: form.secondaryColor,
                  accentColor: form.accentColor,
                  logoWhiteUrl: form.logoWhiteUrl || null,
                  studioSettings: form.studioSettings,
                })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Check-Schritte</CardTitle><CardDescription>Welche Bereiche Kunden durchlaufen</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(WIZARD_STEP_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <Switch checked={form.featureConfig.steps[key] ?? true} onCheckedChange={(c) => setForm({
                      ...form,
                      featureConfig: {
                        ...form.featureConfig,
                        steps: { ...form.featureConfig.steps, [key]: c },
                      },
                    })} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Zusatzfunktionen</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <ToggleRow label="KI-Berater" checked={form.featureConfig.kitchenChat} onChange={(c) => setForm({ ...form, featureConfig: { ...form.featureConfig, kitchenChat: c } })} />
                <ToggleRow label="PDF-Export" checked={form.featureConfig.pdfExport} onChange={(c) => setForm({ ...form, featureConfig: { ...form.featureConfig, pdfExport: c } })} />
                <ToggleRow label="Protokoll per E-Mail" checked={form.featureConfig.protocolEmail} onChange={(c) => setForm({ ...form, featureConfig: { ...form.featureConfig, protocolEmail: c } })} />
                <ToggleRow label="Terminbuchung" checked={form.showAppointmentBooking} onChange={(c) => setForm({ ...form, showAppointmentBooking: c })} />
                <ToggleRow label="Hersteller-Auswahl" checked={form.showManufacturerField} onChange={(c) => setForm({ ...form, showManufacturerField: c })} />
                <ToggleRow label="Landing Page" checked={form.landingPage.showLandingPage} onChange={(c) => setForm({ ...form, landingPage: { ...form.landingPage, showLandingPage: c } })} />
                <ToggleRow label="Standard-Branding" checked={form.showDefaultBranding} onChange={(c) => setForm({ ...form, showDefaultBranding: c })} />
                <SaveButton saving={saving} onClick={() => save({
                  featureConfig: form.featureConfig,
                  showAppointmentBooking: form.showAppointmentBooking,
                  showManufacturerField: form.showManufacturerField,
                  showDefaultBranding: form.showDefaultBranding,
                  landingPage: { showLandingPage: form.landingPage.showLandingPage },
                })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Hersteller-Programm</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(MANUFACTURER_CATEGORIES).map(([cat, list]) => (
                  <div key={cat}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((m) => {
                        const on = form.enabledManufacturers.includes(m);
                        return (
                          <button key={m} type="button" onClick={() => {
                            const next = on ? form.enabledManufacturers.filter((x) => x !== m) : [...form.enabledManufacturers, m];
                            setForm({ ...form, enabledManufacturers: next });
                          }} className={`px-3 py-1 rounded-full text-sm ${on ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Field label="Eigener Hersteller" value={form.newManufacturer} onChange={(v) => setForm({ ...form, newManufacturer: v })} />
                <Button variant="outline" size="sm" onClick={() => {
                  const v = form.newManufacturer.trim();
                  if (!v) return;
                  if (!form.customManufacturers.includes(v)) {
                    setForm({ ...form, customManufacturers: [...form.customManufacturers, v], newManufacturer: '' });
                  }
                }}>Hinzufügen</Button>
                <div className="flex flex-wrap gap-2">
                  {form.customManufacturers.map((m) => (
                    <span key={m} className="px-2 py-1 bg-muted rounded text-sm">{m}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Budget Min (€)" value={String(form.studioSettings.catalog.budgetMin)} onChange={(v) => setForm({
                    ...form,
                    studioSettings: { ...form.studioSettings, catalog: { ...form.studioSettings.catalog, budgetMin: Number(v) || 0 } },
                  })} />
                  <Field label="Budget Max (€)" value={String(form.studioSettings.catalog.budgetMax)} onChange={(v) => setForm({
                    ...form,
                    studioSettings: { ...form.studioSettings, catalog: { ...form.studioSettings.catalog, budgetMax: Number(v) || 0 } },
                  })} />
                </div>
                <SaveButton saving={saving} onClick={() => save({
                  enabledManufacturers: form.enabledManufacturers,
                  customManufacturers: form.customManufacturers,
                  studioSettings: form.studioSettings,
                })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>PDF & Dokumente</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={form.studioSettings.pdf.template} onValueChange={(v) => setForm({
                  ...form,
                  studioSettings: { ...form.studioSettings, pdf: { ...form.studioSettings.pdf, template: v as StudioSettings['pdf']['template'] } },
                })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Kompakt</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="detailed">Ausführlich</SelectItem>
                  </SelectContent>
                </Select>
                <TextField label="PDF-Footer-Text" value={form.studioSettings.pdf.footerText} onChange={(v) => setForm({
                  ...form, studioSettings: { ...form.studioSettings, pdf: { ...form.studioSettings.pdf, footerText: v } },
                })} />
                <TextField label="Datenschutz-Hinweis (im PDF)" value={form.studioSettings.pdf.privacySnippet} onChange={(v) => setForm({
                  ...form, studioSettings: { ...form.studioSettings, pdf: { ...form.studioSettings.pdf, privacySnippet: v } },
                })} />
                <TextField label="AGB / Bedingungen (im PDF)" value={form.studioSettings.pdf.termsSnippet} onChange={(v) => setForm({
                  ...form, studioSettings: { ...form.studioSettings, pdf: { ...form.studioSettings.pdf, termsSnippet: v } },
                })} />
                <ToggleRow label="PDF automatisch ans Studio mailen" checked={form.studioSettings.pdf.autoEmailToStudio} onChange={(c) => setForm({
                  ...form, studioSettings: { ...form.studioSettings, pdf: { ...form.studioSettings.pdf, autoEmailToStudio: c } },
                })} />
                <SaveButton saving={saving} onClick={() => save({ studioSettings: form.studioSettings })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-4">
            <DsgvoChecklist branding={{
              ...branding,
              privacyUrl: form.privacyUrl || null,
              imprintUrl: form.imprintUrl || null,
              contact: form.contact,
              studioSettings: form.studioSettings,
            }} />
            <Card>
              <CardHeader><CardTitle>Rechtliches & Datenschutz</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Link Datenschutzerklärung" value={form.privacyUrl || ''} onChange={(v) => setForm({ ...form, privacyUrl: v })} />
                <Field label="Link Impressum" value={form.imprintUrl || ''} onChange={(v) => setForm({ ...form, imprintUrl: v })} />
                <TextField label="Einwilligungstext (Web & App)" value={form.studioSettings.legal.consentText} onChange={(v) => setForm({
                  ...form, studioSettings: { ...form.studioSettings, legal: { ...form.studioSettings.legal, consentText: v } },
                })} />
                <SaveButton saving={saving} onClick={() => save({
                  privacyUrl: form.privacyUrl || null,
                  imprintUrl: form.imprintUrl || null,
                  studioSettings: form.studioSettings,
                })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="landing" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Landing Page</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Headline" value={form.landingPage.headline} onChange={(v) => setForm({ ...form, landingPage: { ...form.landingPage, headline: v } })} />
                <Field label="Subheadline" value={form.landingPage.subheadline} onChange={(v) => setForm({ ...form, landingPage: { ...form.landingPage, subheadline: v } })} />
                <Field label="Vorteil 1" value={form.landingPage.benefit1} onChange={(v) => setForm({ ...form, landingPage: { ...form.landingPage, benefit1: v } })} />
                <Field label="Vorteil 2" value={form.landingPage.benefit2} onChange={(v) => setForm({ ...form, landingPage: { ...form.landingPage, benefit2: v } })} />
                <Field label="Vorteil 3" value={form.landingPage.benefit3} onChange={(v) => setForm({ ...form, landingPage: { ...form.landingPage, benefit3: v } })} />
                <Field label="CTA-Text" value={form.landingPage.ctaText} onChange={(v) => setForm({ ...form, landingPage: { ...form.landingPage, ctaText: v } })} />
                <TextField label="Warum-Text" value={form.landingPage.whyText} onChange={(v) => setForm({ ...form, landingPage: { ...form.landingPage, whyText: v } })} />
                <SaveButton saving={saving} onClick={() => save({ landingPage: form.landingPage })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5" />Kunden-Link</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {customerUrl ? (
                  <>
                    {checkUrl && (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(checkUrl)}`}
                        alt="QR"
                        className="mx-auto border rounded-lg"
                      />
                    )}
                    <p className="text-sm break-all"><strong>Landing:</strong> {customerUrl}</p>
                    <p className="text-sm break-all"><strong>Check (Browser):</strong> {checkUrl}</p>
                    <p className="text-sm break-all"><strong>App Deep Link:</strong> {deepLink}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(checkUrl); toast.success('Link kopiert'); }}>
                        <Copy className="w-4 h-4 mr-1" />Check-Link
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(customerUrl); toast.success('Landing kopiert'); }}>
                        <Globe className="w-4 h-4 mr-1" />Landing
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kunden brauchen keine APK – der Browser-Link funktioniert sofort. Die App ist optional.
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Bitte zuerst einen Studio-Link (Slug) unter Grunddaten speichern.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsPanel getAnalytics={getAnalytics} />
            <Card>
              <CardHeader><CardTitle>Analytics & Intern</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Google Analytics ID" value={form.studioSettings.analytics.googleAnalyticsId || ''} onChange={(v) => setForm({
                  ...form, studioSettings: { ...form.studioSettings, analytics: { ...form.studioSettings.analytics, googleAnalyticsId: v || null } },
                })} />
                <TextField label="Interne Notizen (nur Studio)" value={form.studioSettings.analytics.internalNotes} onChange={(v) => setForm({
                  ...form, studioSettings: { ...form.studioSettings, analytics: { ...form.studioSettings.analytics, internalNotes: v } },
                })} />
                <SaveButton saving={saving} onClick={() => save({ studioSettings: form.studioSettings })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin-Passwort ändern</CardTitle>
                <CardDescription>
                  Mit dem aktuellen Login authentifiziert – kein zusätzlicher Schlüssel nötig.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <Label>Neues Passwort</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="mindestens 8 Zeichen"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Neues Passwort bestätigen</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={changingPassword || !newPassword}
                  onClick={handleChangePassword}
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Passwort ändern
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function initForm(b: BrandingData) {
  return {
    studioName: b.studioName,
    displayAppName: b.displayAppName || '',
    slogan: b.slogan || '',
    studioSlug: b.studioSlug || '',
    studioCode: b.studioCode || '',
    logoWhiteUrl: b.logoWhiteUrl || '',
    primaryColor: b.primaryColor,
    secondaryColor: b.secondaryColor || '#6B7280',
    accentColor: b.accentColor || '#16A34A',
    privacyUrl: b.privacyUrl || '',
    imprintUrl: b.imprintUrl || '',
    showDefaultBranding: b.showDefaultBranding,
    showAppointmentBooking: b.showAppointmentBooking,
    showManufacturerField: b.showManufacturerField,
    enabledManufacturers: [...b.enabledManufacturers],
    customManufacturers: [...b.customManufacturers],
    newManufacturer: '',
    landingPage: { ...b.landingPage },
    contact: { ...b.contact },
    featureConfig: { ...b.featureConfig, steps: { ...b.featureConfig.steps } },
    studioSettings: JSON.parse(JSON.stringify(b.studioSettings)) as StudioSettings,
  };
}

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
        <input type="color" value={value.startsWith('#') ? value : '#888888'} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded border" />
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <Button className="w-full" disabled={saving} onClick={onClick}>
      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
      Speichern
    </Button>
  );
}
