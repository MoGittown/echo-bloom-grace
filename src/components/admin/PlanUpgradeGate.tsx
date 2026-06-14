import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlanFeature } from '@/lib/planFeatures';
import { PLAN_LABELS } from '@/types/billing';

const FEATURE_COPY: Record<PlanFeature, { title: string; desc: string; requiredPlan: 'pro' | 'premium' }> = {
  analytics: {
    title: 'Statistik-Dashboard',
    desc: 'Funnel-Auswertung, Conversion-Tracking und Fehlerübersicht sind im Pro-Tarif enthalten.',
    requiredPlan: 'pro',
  },
  manufacturerCatalog: {
    title: 'Hersteller & Sortiment',
    desc: 'Individuelle Herstellerlisten und erweiterte Katalog-Einstellungen sind ab Pro verfügbar.',
    requiredPlan: 'pro',
  },
  kitchenChat: {
    title: 'Küchen-Assistent (Chat)',
    desc: 'Der KI-Chat im Kunden-Check ist ab dem Pro-Tarif freigeschaltet.',
    requiredPlan: 'pro',
  },
};

type Props = {
  feature: PlanFeature;
  children: React.ReactNode;
  hasFeature: boolean;
};

export function PlanUpgradeGate({ feature, hasFeature, children }: Props) {
  if (hasFeature) return <>{children}</>;

  const copy = FEATURE_COPY[feature];
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Aktuell: <strong>{PLAN_LABELS.starter}</strong> · Upgrade auf{' '}
          <strong>{PLAN_LABELS[copy.requiredPlan]}</strong>
        </p>
        <Button asChild variant="default">
          <Link to="/admin" onClick={() => {
            // Tab „Abo“ per Hash — AdminTabbedDashboard defaultValue bleibt general;
            // Nutzer wechselt manuell; optional später defaultValue aus URL
          }}>
            Im Tab „Abo“ upgraden
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
