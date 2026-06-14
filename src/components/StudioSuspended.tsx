import { AlertTriangle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { StudioAccess } from '@/lib/planFeatures';
import { STATUS_LABELS } from '@/types/billing';

type Props = {
  displayName: string;
  access: StudioAccess;
  audience?: 'customer' | 'studio';
};

export function StudioSuspended({ displayName, access, audience = 'customer' }: Props) {
  const statusLabel = STATUS_LABELS[access.subscriptionStatus] ?? access.subscriptionStatus;

  if (audience === 'customer') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-600" />
        <h1 className="text-xl font-semibold">Check vorübergehend nicht verfügbar</h1>
        <p className="text-muted-foreground max-w-md">
          Der Küchen-Check von <strong>{displayName}</strong> ist derzeit nicht erreichbar.
          Bitte wenden Sie sich direkt an Ihr Küchenstudio oder versuchen Sie es später erneut.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <CreditCard className="w-12 h-12 text-destructive" />
      <h1 className="text-xl font-semibold">Abo inaktiv ({statusLabel})</h1>
      <p className="text-muted-foreground max-w-md">
        Ihr Kunden-Check ist gesperrt, bis das Abo wieder aktiv ist.
        Bitte schließen Sie die Zahlung im Admin unter „Abo“ ab.
      </p>
      <Button asChild>
        <Link to="/admin">Zum Admin</Link>
      </Button>
    </div>
  );
}

export function StudioGraceBanner({ access }: { access: StudioAccess }) {
  if (!access.inGracePeriod || !access.billingGraceEndsAt) return null;

  const until = new Date(access.billingGraceEndsAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm px-4 py-2 text-center">
      <AlertTriangle className="inline w-4 h-4 mr-1 -mt-0.5" />
      Zahlung überfällig — der Check bleibt bis zum <strong>{until}</strong> noch erreichbar.
    </div>
  );
}
