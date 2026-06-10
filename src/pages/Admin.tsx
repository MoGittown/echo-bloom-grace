import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBrandingAdmin } from '@/hooks/useBranding';
import { AdminTabbedDashboard } from '@/components/admin/AdminTabbedDashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Lock, Loader2, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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
    logout,
  } = useBrandingAdmin();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    const ok = await verifyPassword(password);
    setIsSubmitting(false);
    if (ok) toast.success('Angemeldet');
    else toast.error('Falsches Passwort');
    setPassword('');
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Passwort mindestens 6 Zeichen');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    setIsSubmitting(true);
    const ok = await setupBranding(password, { studioName });
    setIsSubmitting(false);
    if (ok) toast.success('Studio eingerichtet');
    else toast.error('Einrichtung fehlgeschlagen');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <AdminTabbedDashboard
        branding={branding}
        updateBranding={updateBranding}
        uploadLogo={uploadLogo}
        logout={logout}
      />
    );
  }

  if (needsSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Studio einrichten</CardTitle>
            <CardDescription>Admin-Passwort und optionaler Studioname</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label>Studioname</Label>
                <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="Mein Küchenstudio" />
              </div>
              <div className="space-y-2">
                <Label>Admin-Passwort</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
              </div>
              <div className="space-y-2">
                <Label>Passwort bestätigen</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Einrichten
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Studio-Admin</CardTitle>
          <CardDescription>Branding, Check-Schritte, PDF & Kunden-Links</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Passwort</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Anmelden
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
