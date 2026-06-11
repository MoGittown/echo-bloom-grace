import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { BrandingData } from '@/hooks/useBranding';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Item = { label: string; ok: boolean; hint?: string };

function buildItems(b: BrandingData): Item[] {
  const consent = b.studioSettings?.legal?.consentText?.trim();
  return [
    {
      label: 'Link Datenschutzerklärung',
      ok: Boolean(b.privacyUrl?.trim()),
      hint: 'Pflicht für DSGVO — URL des Studios',
    },
    {
      label: 'Link Impressum',
      ok: Boolean(b.imprintUrl?.trim()),
      hint: 'Pflicht für geschäftliche Web/App-Nutzung',
    },
    {
      label: 'Einwilligungstext (Kunden-Checkbox)',
      ok: Boolean(consent && consent.length >= 20),
      hint: 'Wird bei Protokoll-Versand und Kontakt angezeigt',
    },
    {
      label: 'E-Mail fürs Beratungsprotokoll',
      ok: Boolean(b.contact.email?.trim()),
      hint: 'Empfänger der Kundendaten',
    },
    {
      label: 'PDF-Datenschutzhinweis',
      ok: Boolean(b.studioSettings?.pdf?.privacySnippet?.trim()),
      hint: 'Empfohlen im exportierten PDF',
    },
  ];
}

export function DsgvoChecklist({ branding }: { branding: BrandingData }) {
  const items = buildItems(branding);
  const allOk = items.every((i) => i.ok);
  const done = items.filter((i) => i.ok).length;

  return (
    <Alert variant={allOk ? 'default' : 'destructive'} className="mb-4">
      <AlertTitle className="flex items-center gap-2">
        {allOk ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        DSGVO-Check ({done}/{items.length})
      </AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((item) => (
            <li key={item.label} className="flex items-start gap-2">
              {item.ok ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>
                <strong>{item.label}</strong>
                {item.hint && !item.ok && (
                  <span className="block text-muted-foreground text-xs">{item.hint}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Web- und App-Admin sind identisch — diese Einstellungen gelten für beide Kanäle.
        </p>
      </AlertDescription>
    </Alert>
  );
}
