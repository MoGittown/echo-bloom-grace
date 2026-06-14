import { Link, useParams } from 'react-router-dom';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { studioLandingUrl, studioCheckUrl, studioLandingPath } from '@/lib/studioPaths';

type LegalKind = 'impressum' | 'datenschutz';

const LEGAL_TITLES: Record<LegalKind, string> = {
  impressum: 'Impressum',
  datenschutz: 'Datenschutzerklärung',
};

export default function StudioLegal({ kind }: { kind: LegalKind }) {
  const { slug } = useParams<{ slug: string }>();
  const { branding, isLoading } = useBranding(slug);

  const displayName = branding.displayAppName || branding.studioName || 'Küchenstudio';
  const backUrl = slug ? studioLandingPath(slug) : '/';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Wird geladen…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="h-10 w-10 object-contain shrink-0" />
            ) : (
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <ChefHat className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground">{LEGAL_TITLES[kind]}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={backUrl}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Zurück
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl prose prose-neutral dark:prose-invert">
        {kind === 'impressum' ? (
          <ImpressumContent branding={branding} displayName={displayName} />
        ) : (
          <DatenschutzContent branding={branding} displayName={displayName} slug={slug} />
        )}
      </main>
    </div>
  );
}

function ImpressumContent({
  branding,
  displayName,
}: {
  branding: ReturnType<typeof useBranding>['branding'];
  displayName: string;
}) {
  return (
    <>
      <h1>Impressum</h1>
      <p>Angaben gemäß § 5 TMG</p>

      <h2>Anbieter</h2>
      <p>
        <strong>{displayName}</strong>
        <br />
        {branding.contact.address || 'Adresse auf Anfrage'}
      </p>

      <h2>Kontakt</h2>
      <p>
        {branding.contact.phone && (
          <>
            Telefon: <a href={`tel:${branding.contact.phone.replace(/\s/g, '')}`}>{branding.contact.phone}</a>
            <br />
          </>
        )}
        {branding.contact.email && (
          <>
            E-Mail: <a href={`mailto:${branding.contact.email}`}>{branding.contact.email}</a>
            <br />
          </>
        )}
        {branding.contact.website && (
          <>
            Website:{' '}
            <a href={branding.contact.website.startsWith('http') ? branding.contact.website : `https://${branding.contact.website}`}>
              {branding.contact.website}
            </a>
          </>
        )}
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        {displayName}
        <br />
        {branding.contact.address}
      </p>

      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr/
        </a>
        . Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </>
  );
}

function DatenschutzContent({
  branding,
  displayName,
  slug,
}: {
  branding: ReturnType<typeof useBranding>['branding'];
  displayName: string;
  slug?: string;
}) {
  const webOrigin = import.meta.env.VITE_PUBLIC_WEB_URL || 'https://kuechenready.de';
  const checkUrl = slug ? studioCheckUrl(webOrigin, slug) : webOrigin;

  return (
    <>
      <h1>Datenschutzerklärung</h1>
      <p>Stand: {new Date().toLocaleDateString('de-DE')}</p>

      <h2>1. Verantwortlicher</h2>
      <p>
        {displayName}
        <br />
        {branding.contact.address}
        <br />
        E-Mail: {branding.contact.email}
      </p>

      <h2>2. Zweck des Küchen-Checks</h2>
      <p>
        Über unseren digitalen Küchen-Check ({checkUrl}) erfassen wir Ihre Angaben zur Vorbereitung
        eines persönlichen Beratungstermins bei {displayName}. Dazu können gehören: Name, Telefonnummer,
        E-Mail-Adresse, Angaben zu Küchenwünschen, Raummaße, Fotos und Grundrisse.
      </p>

      <h2>3. Rechtsgrundlage</h2>
      <p>
        Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO,
        die Sie vor dem Absenden des Protokolls aktiv bestätigen.
      </p>

      <h2>4. Speicherdauer</h2>
      <p>
        Wir speichern Ihre Daten nur so lange, wie es für die Vorbereitung und Durchführung der
        Küchenberatung erforderlich ist, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2>5. Empfänger</h2>
      <p>
        Ihre Daten werden an {displayName} übermittelt. Technische Bereitstellung des Küchen-Checks
        erfolgt über Küchenready (Hosting und Formular). Es werden keine Daten zu Werbezwecken verkauft.
      </p>

      <h2>6. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit und Widerruf Ihrer Einwilligung. Wenden Sie sich an{' '}
        <a href={`mailto:${branding.contact.email}`}>{branding.contact.email}</a>.
        Beschwerden können Sie bei der zuständigen Datenschutzaufsicht einreichen.
      </p>

      <h2>7. Cookies &amp; Technik</h2>
      <p>
        Der Küchen-Check nutzt technisch notwendige Speicherung im Browser (z. B. Fortschritt der
        Eingaben). Es werden keine Tracking-Cookies zu Marketingzwecken gesetzt, sofern im Admin
        keine Analytics-ID hinterlegt wurde.
      </p>
    </>
  );
}
