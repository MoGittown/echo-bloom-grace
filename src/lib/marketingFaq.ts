/** FAQ für B2B-Marketing – eine Quelle für UI + JSON-LD Schema */
export const STUDIO_FAQ = [
  {
    q: 'Müssen meine Kunden etwas installieren?',
    a: 'Nein. Der Küchencheck läuft direkt im Browser. Optional gibt es zusätzlich Ihre eigene App für iOS und Android.',
  },
  {
    q: 'Ist das datenschutzkonform?',
    a: 'Ja. Die Daten werden auf Servern in der EU verarbeitet, die Einwilligung ist im Ablauf integriert und jedes Studio hat eine eigene Impressums- und Datenschutzseite.',
  },
  {
    q: 'Wie schnell bin ich startklar?',
    a: 'Nach einem kurzen Onboarding (Logo, Farben, Kontaktdaten) ist Ihr Studio in der Regel innerhalb weniger Tage live.',
  },
  {
    q: 'Sieht man, dass es von Küchenready ist?',
    a: 'Nein. Der Auftritt läuft komplett unter Ihrem Namen und Branding (White-Label).',
  },
  {
    q: 'Was kostet der Einstieg wirklich?',
    a: 'Die genannten Preise sind ein Vorschlag und werden individuell mit Ihnen abgestimmt. Im Pilotzeitraum entfällt die Einrichtungsgebühr.',
  },
] as const;

export function studioFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: STUDIO_FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
