import { useState, useRef, useEffect } from 'react';
import { useBrandingAdmin } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Trash2, 
  Building2, 
  Image as ImageIcon, 
  Lock, 
  LogOut, 
  Loader2,
  Check,
  ChefHat,
  ArrowLeft,
  Palette,
  LayoutTemplate,
  Type,
  Sparkles,
  MapPin,
  Phone,
  AtSign,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AdminPage() {
  const { 
    branding, 
    isLoading, 
    isAuthenticated, 
    needsSetup, 
    verifyPassword, 
    setupBranding, 
    updateBranding, 
    uploadLogo,
    logout 
  } = useBrandingAdmin();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedColor, setEditedColor] = useState('#C2410C');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for editing
  const [editedStudioName, setEditedStudioName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [hasColorChanges, setHasColorChanges] = useState(false);
  const [hasLandingChanges, setHasLandingChanges] = useState(false);
  const [hasContactChanges, setHasContactChanges] = useState(false);
  
  // Landing page editing
  const [editedLanding, setEditedLanding] = useState({
    headline: '',
    subheadline: '',
    benefit1: '',
    benefit2: '',
    benefit3: '',
    ctaText: '',
    whyText: '',
    showLandingPage: true,
  });

  // Contact editing
  const [editedContact, setEditedContact] = useState({
    address: '',
    phone: '',
    email: '',
    website: '',
  });

  // Initialize edit state when branding loads
  useEffect(() => {
    if (branding.studioName) {
      setEditedStudioName(branding.studioName);
    }
    if (branding.primaryColor) {
      setEditedColor(branding.primaryColor);
    }
    if (branding.landingPage) {
      setEditedLanding({
        headline: branding.landingPage.headline,
        subheadline: branding.landingPage.subheadline,
        benefit1: branding.landingPage.benefit1,
        benefit2: branding.landingPage.benefit2,
        benefit3: branding.landingPage.benefit3,
        ctaText: branding.landingPage.ctaText,
        whyText: branding.landingPage.whyText,
        showLandingPage: branding.landingPage.showLandingPage,
      });
    }
    if (branding.contact) {
      setEditedContact({
        address: branding.contact.address || '',
        phone: branding.contact.phone || '',
        email: branding.contact.email || '',
        website: branding.contact.website || '',
      });
    }
  }, [branding]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsSubmitting(true);
    const success = await verifyPassword(password);
    setIsSubmitting(false);

    if (success) {
      toast.success('Erfolgreich angemeldet');
      setEditedStudioName(branding.studioName);
      setEditedColor(branding.primaryColor);
      setEditedLanding({
        headline: branding.landingPage.headline,
        subheadline: branding.landingPage.subheadline,
        benefit1: branding.landingPage.benefit1,
        benefit2: branding.landingPage.benefit2,
        benefit3: branding.landingPage.benefit3,
        ctaText: branding.landingPage.ctaText,
        whyText: branding.landingPage.whyText,
        showLandingPage: branding.landingPage.showLandingPage,
      });
    } else {
      toast.error('Falsches Passwort');
    }
    setPassword('');
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    setIsSubmitting(true);
    const success = await setupBranding(password, { studioName });
    setIsSubmitting(false);

    if (success) {
      toast.success('Branding erfolgreich eingerichtet');
      setEditedStudioName(studioName);
    } else {
      toast.error('Einrichtung fehlgeschlagen');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wählen Sie eine Bilddatei aus');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Das Bild darf maximal 5 MB groß sein');
      return;
    }

    setIsUploading(true);
    const logoUrl = await uploadLogo(file);
    setIsUploading(false);

    if (logoUrl) {
      toast.success('Logo erfolgreich hochgeladen');
    } else {
      toast.error('Fehler beim Hochladen des Logos');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setIsSaving(true);
    const success = await updateBranding({ logoUrl: null });
    setIsSaving(false);

    if (success) {
      toast.success('Logo entfernt');
    } else {
      toast.error('Fehler beim Entfernen');
    }
  };

  const handleSaveStudioName = async () => {
    if (editedStudioName === branding.studioName) return;

    setIsSaving(true);
    const success = await updateBranding({ studioName: editedStudioName });
    setIsSaving(false);

    if (success) {
      toast.success('Studioname gespeichert');
      setHasChanges(false);
    } else {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleToggleDefaultBranding = async (checked: boolean) => {
    setIsSaving(true);
    const success = await updateBranding({ showDefaultBranding: checked });
    setIsSaving(false);

    if (!success) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleSaveColor = async () => {
    if (editedColor === branding.primaryColor) return;

    setIsSaving(true);
    const success = await updateBranding({ primaryColor: editedColor });
    setIsSaving(false);

    if (success) {
      toast.success('Farbe gespeichert');
      setHasColorChanges(false);
    } else {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleSaveLanding = async () => {
    setIsSaving(true);
    const success = await updateBranding({ 
      landingPage: editedLanding 
    });
    setIsSaving(false);

    if (success) {
      toast.success('Landing Page gespeichert');
      setHasLandingChanges(false);
    } else {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleToggleLandingPage = async (checked: boolean) => {
    setEditedLanding(prev => ({ ...prev, showLandingPage: checked }));
    setIsSaving(true);
    const success = await updateBranding({ 
      landingPage: { showLandingPage: checked } 
    });
    setIsSaving(false);

    if (!success) {
      toast.error('Fehler beim Speichern');
    }
  };

  const updateLandingField = (field: string, value: string) => {
    setEditedLanding(prev => ({ ...prev, [field]: value }));
    setHasLandingChanges(true);
  };

  const updateContactField = (field: string, value: string) => {
    setEditedContact(prev => ({ ...prev, [field]: value }));
    setHasContactChanges(true);
  };

  const handleSaveContact = async () => {
    setIsSaving(true);
    const success = await updateBranding({ 
      contact: {
        address: editedContact.address || null,
        phone: editedContact.phone || null,
        email: editedContact.email || null,
        website: editedContact.website || null,
      }
    });
    setIsSaving(false);

    if (success) {
      toast.success('Kontaktdaten gespeichert');
      setHasContactChanges(false);
    } else {
      toast.error('Fehler beim Speichern');
    }
  };

  // Predefined color palette
  const colorPresets = [
    { name: 'Terrakotta', value: '#C2410C' },
    { name: 'Blau', value: '#1D4ED8' },
    { name: 'Grün', value: '#15803D' },
    { name: 'Lila', value: '#7C3AED' },
    { name: 'Pink', value: '#BE185D' },
    { name: 'Grau', value: '#374151' },
    { name: 'Braun', value: '#78350F' },
    { name: 'Teal', value: '#0D9488' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Lade...</p>
        </div>
      </div>
    );
  }

  // Setup Screen
  if (needsSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Studio-Branding einrichten</CardTitle>
            <CardDescription>
              Erstellen Sie ein Admin-Passwort, um Ihr Branding zu verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studioName">Studioname (optional)</Label>
                <Input
                  id="studioName"
                  placeholder="Mein Küchenstudio"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Admin-Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Passwort wiederholen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird eingerichtet...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Branding einrichten
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Admin-Bereich</CardTitle>
            <CardDescription>
              Melden Sie sich an, um das Studio-Branding zu verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin-Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Passwort eingeben"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird geprüft...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Anmelden
                  </>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Checkliste
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ChefHat className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="font-semibold">Admin-Bereich</h1>
                <p className="text-xs text-muted-foreground">Studio-Branding verwalten</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Zur Checkliste</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Abmelden</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Studio-Logo
            </CardTitle>
            <CardDescription>
              Laden Sie Ihr Logo hoch – es erscheint im Header und auf allen Protokollen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branding.logoUrl ? (
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                  <img 
                    src={branding.logoUrl} 
                    alt="Studio Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Logo ändern
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleRemoveLogo}
                    disabled={isSaving}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Entfernen
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-40 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isUploading ? 'Wird hochgeladen...' : 'Logo hochladen (PNG, JPG, max. 5 MB)'}
                </span>
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-3">
              Empfohlen: Quadratisches Format, mindestens 200×200 Pixel, transparenter Hintergrund (PNG)
            </p>
          </CardContent>
        </Card>

        {/* Studio Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Studioname
            </CardTitle>
            <CardDescription>
              Der Name erscheint im Header und auf dem Beratungsprotokoll
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Mein Küchenstudio GmbH"
                value={editedStudioName}
                onChange={(e) => {
                  setEditedStudioName(e.target.value);
                  setHasChanges(e.target.value !== branding.studioName);
                }}
              />
              <Button 
                onClick={handleSaveStudioName}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Primary Color */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Primärfarbe
            </CardTitle>
            <CardDescription>
              Wählen Sie die Hauptfarbe für Buttons, Akzente und Highlights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setEditedColor(preset.value);
                    setHasColorChanges(preset.value !== branding.primaryColor);
                  }}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    editedColor === preset.value 
                      ? 'border-foreground scale-110 shadow-lg' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
            <div className="flex gap-3 items-center">
              <Label htmlFor="customColor" className="shrink-0">Eigene Farbe:</Label>
              <div className="flex gap-2 items-center flex-1">
                <input
                  type="color"
                  id="customColor"
                  value={editedColor}
                  onChange={(e) => {
                    setEditedColor(e.target.value);
                    setHasColorChanges(e.target.value !== branding.primaryColor);
                  }}
                  className="w-12 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={editedColor}
                  onChange={(e) => {
                    setEditedColor(e.target.value);
                    setHasColorChanges(e.target.value !== branding.primaryColor);
                  }}
                  placeholder="#C2410C"
                  className="w-28 font-mono"
                />
              </div>
              <Button 
                onClick={handleSaveColor}
                disabled={!hasColorChanges || isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
              </Button>
            </div>
            <div 
              className="p-4 rounded-lg text-white text-center font-medium"
              style={{ backgroundColor: editedColor }}
            >
              Vorschau: So sehen Buttons aus
            </div>
          </CardContent>
        </Card>

        {/* Landing Page Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5" />
              Landing Page
            </CardTitle>
            <CardDescription>
              Passen Sie die Startseite an, die Kunden vor der Checkliste sehen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <Label>Landing Page anzeigen</Label>
                <p className="text-xs text-muted-foreground">
                  Zeigt eine Willkommens-Seite vor der Checkliste
                </p>
              </div>
              <Switch
                checked={editedLanding.showLandingPage}
                onCheckedChange={handleToggleLandingPage}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="headline" className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Headline
                </Label>
                <Input
                  id="headline"
                  placeholder="Vermeiden Sie die 3 teuersten Fehler..."
                  value={editedLanding.headline}
                  onChange={(e) => updateLandingField('headline', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subheadline">Subheadline</Label>
                <Input
                  id="subheadline"
                  placeholder="In nur 7 Minuten perfekt vorbereitet..."
                  value={editedLanding.subheadline}
                  onChange={(e) => updateLandingField('subheadline', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Vorteile (3 Punkte)
                </Label>
                <Input
                  placeholder="Vorteil 1"
                  value={editedLanding.benefit1}
                  onChange={(e) => updateLandingField('benefit1', e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="Vorteil 2"
                  value={editedLanding.benefit2}
                  onChange={(e) => updateLandingField('benefit2', e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="Vorteil 3"
                  value={editedLanding.benefit3}
                  onChange={(e) => updateLandingField('benefit3', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaText">Button-Text</Label>
                <Input
                  id="ctaText"
                  placeholder="Jetzt starten"
                  value={editedLanding.ctaText}
                  onChange={(e) => updateLandingField('ctaText', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whyText">Warum-Text</Label>
                <Textarea
                  id="whyText"
                  placeholder="Erklären Sie, warum Kunden diese Checkliste ausfüllen sollten..."
                  value={editedLanding.whyText}
                  onChange={(e) => updateLandingField('whyText', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveLanding}
              disabled={!hasLandingChanges || isSaving}
              className="w-full"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Landing Page speichern
            </Button>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Kontaktdaten
            </CardTitle>
            <CardDescription>
              Diese Daten erscheinen in der Fußzeile des PDF-Protokolls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactAddress" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Adresse
              </Label>
              <Input
                id="contactAddress"
                placeholder="Musterstraße 123, 12345 Musterstadt"
                value={editedContact.address}
                onChange={(e) => updateContactField('address', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefon
              </Label>
              <Input
                id="contactPhone"
                placeholder="+49 123 456789"
                value={editedContact.phone}
                onChange={(e) => updateContactField('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                E-Mail
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="info@mein-kuechenstudio.de"
                value={editedContact.email}
                onChange={(e) => updateContactField('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactWebsite" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </Label>
              <Input
                id="contactWebsite"
                placeholder="www.mein-kuechenstudio.de"
                value={editedContact.website}
                onChange={(e) => updateContactField('website', e.target.value)}
              />
            </div>

            <Button 
              onClick={handleSaveContact}
              disabled={!hasContactChanges || isSaving}
              className="w-full"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Kontaktdaten speichern
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Einstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Standard-Branding anzeigen</Label>
                <p className="text-xs text-muted-foreground">
                  Zeigt "Küchen-Beratungsprotokoll" wenn kein eigenes Logo/Name vorhanden
                </p>
              </div>
              <Switch
                checked={branding.showDefaultBranding}
                onCheckedChange={handleToggleDefaultBranding}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Vorschau</CardTitle>
            <CardDescription>
              So sieht das Branding im Protokoll-Header aus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-6 border text-center">
              {branding.logoUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img 
                    src={branding.logoUrl} 
                    alt="Studio Logo" 
                    className="h-16 max-w-[200px] object-contain"
                  />
                  {branding.studioName && (
                    <h1 className="text-xl font-bold text-gray-900">
                      {branding.studioName}
                    </h1>
                  )}
                  <p className="text-lg text-gray-600">Küchen-Beratungsprotokoll</p>
                </div>
              ) : branding.studioName ? (
                <div className="flex flex-col items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {branding.studioName}
                  </h1>
                  <p className="text-lg text-gray-600">Küchen-Beratungsprotokoll</p>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">
                  Küchen-Beratungsprotokoll
                </h1>
              )}
              <p className="text-gray-500 mt-2 text-sm">
                Erstellt am {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
