import { useParams, Link } from 'react-router-dom';
import { useBranding } from '@/hooks/useBranding';
import { LandingPage } from '@/components/LandingPage';
import { StudioSuspended, StudioGraceBanner } from '@/components/StudioSuspended';
import { Button } from '@/components/ui/button';
import { Smartphone, Globe, Download } from 'lucide-react';
import { studioCheckPath } from '@/lib/studioPaths';

const APP_STORE_URL = import.meta.env.VITE_PLAY_STORE_URL || '';
const APP_SCHEME = import.meta.env.VITE_APP_DEEP_LINK_SCHEME || 'kuechencheck';

export default function StudioPortal() {
  const { slug } = useParams<{ slug: string }>();
  const { branding, isLoading } = useBranding(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Wird geladen…</p>
      </div>
    );
  }

  if (!branding.id && slug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-xl font-semibold">Studio nicht gefunden</h1>
        <p className="text-muted-foreground text-center">
          Der Link „{slug}“ ist nicht gültig. Bitte wenden Sie sich an Ihr Küchenstudio.
        </p>
      </div>
    );
  }

  const deepLink = `${APP_SCHEME}://studio/${slug}`;
  const displayName =
    branding.displayAppName || branding.studioName || 'Küchen-Beratung';

  if (slug && !branding.studioAccess.canAccessCheck) {
    return <StudioSuspended displayName={displayName} access={branding.studioAccess} />;
  }

  const handleOpenApp = () => {
    window.location.href = deepLink;
    if (APP_STORE_URL) {
      setTimeout(() => {
        window.location.href = APP_STORE_URL;
      }, 1500);
    }
  };

  return (
    <div className="relative">
      <StudioGraceBanner access={branding.studioAccess} />
      <LandingPage
        branding={branding}
        onStart={() => {
          window.location.href = studioCheckPath(slug!);
        }}
      />

      <div className="fixed bottom-0 inset-x-0 z-20 p-4 bg-background/95 border-t backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 h-12" size="lg">
            <Link to={studioCheckPath(slug!)}>
              <Globe className="w-5 h-5 mr-2" />
              Im Browser starten
            </Link>
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12"
            size="lg"
            onClick={handleOpenApp}
          >
            <Smartphone className="w-5 h-5 mr-2" />
            In App öffnen
          </Button>
        </div>
        {APP_STORE_URL && (
          <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <Download className="w-3 h-3" />
            App noch nicht installiert? Nach dem Tippen App aus dem Store laden, dann Link erneut öffnen.
          </p>
        )}
        <p className="text-center text-xs text-muted-foreground mt-1">
          {displayName} · Keine Installation nötig – Browser reicht
        </p>
      </div>
    </div>
  );
}
