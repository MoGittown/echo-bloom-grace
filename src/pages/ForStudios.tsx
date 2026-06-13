import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  LayoutGrid,
  Mail,
  Palette,
  QrCode,
  Ruler,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { STUDIO_FAQ, studioFaqJsonLd } from '@/lib/marketingFaq';

// Plattform-Marke "Küchenready" – bewusst im grünen Markenlook (#2E7D32),
// passend zum App-Icon und Store-Auftritt. Eigenständig, unabhängig von Studio-Themes.
const BRAND = '#2E7D32';
const BRAND_LIGHT = '#3D8B4A';
const CONTACT_EMAIL = 'kontakt@kuechenready.de';
const DEMO_SUBJECT = encodeURIComponent('Demo-Anfrage Küchenready');
const DEMO_BODY = encodeURIComponent(
  'Hallo,\n\nwir sind ein Küchenstudio und möchten Küchenready unverbindlich kennenlernen.\n\nStudio:\nAnsprechpartner:\nTelefon:\n\nViele Grüße',
);
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${DEMO_SUBJECT}&body=${DEMO_BODY}`;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

function Section({
  id,
  className = '',
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`px-4 sm:px-6 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

const STEPS = [
  {
    icon: QrCode,
    title: 'Link oder QR-Code teilen',
    text: 'Sie geben Ihren Kunden bei Anfrage oder Terminbestätigung den persönlichen Studio-Link – per Mail, WhatsApp oder QR-Code im Laden.',
  },
  {
    icon: Smartphone,
    title: 'Kunde bereitet sich vor',
    text: 'Der Kunde erfasst entspannt zu Hause Aufmaß, Grundriss, Stil und Wunschgeräte – in der App oder im Browser, in wenigen Minuten.',
  },
  {
    icon: FileText,
    title: 'Sie erhalten das Protokoll',
    text: 'Noch vor dem Termin landet ein strukturiertes PDF-Protokoll in Ihrem Postfach – inklusive Fotos und allen Eckdaten.',
  },
];

const BENEFITS = [
  {
    icon: BarChart3,
    title: 'Höhere Abschlussquote',
    text: 'Vorbereitete Kunden treffen schneller Entscheidungen – aus Beratung wird Verkauf.',
  },
  {
    icon: Clock,
    title: 'Weniger Beratungszeit',
    text: 'Kein Abfragen von Basisdaten mehr. Sie starten direkt mit der Planung.',
  },
  {
    icon: CheckCircle2,
    title: 'Qualifizierte Leads',
    text: 'Sie sehen vorab Budget, Zeitrahmen und Wünsche und priorisieren Ihre Termine.',
  },
  {
    icon: Palette,
    title: 'Komplett Ihr Branding',
    text: 'Logo, Farben, Texte und rechtliche Seiten – White-Label unter Ihrem Namen.',
  },
  {
    icon: Sparkles,
    title: 'Modernes Image',
    text: 'Ein digitaler, durchdachter Erstkontakt hebt Sie vom Wettbewerb ab.',
  },
  {
    icon: ShieldCheck,
    title: 'DSGVO-konform',
    text: 'Server in der EU, Einwilligung integriert, eigene Datenschutzseite je Studio.',
  },
];

const FEATURES = [
  { icon: LayoutGrid, title: 'Interaktiver Grundriss-Editor', text: 'Wände, Fenster, Türen und Anschlüsse maßstäblich erfassen.' },
  { icon: Ruler, title: 'Aufmaß & Raumdaten', text: 'Maße, Decken­höhe und Besonderheiten strukturiert abfragen.' },
  { icon: Sparkles, title: 'Stil- & Geräteauswahl', text: 'Wunschstil, Fronten, Geräte und Ausstattung auf einen Blick.' },
  { icon: Camera, title: 'Foto-Upload', text: 'Kunden laden Fotos des Raums direkt mit hoch.' },
  { icon: FileText, title: 'Automatisches PDF-Protokoll', text: 'Sauber aufbereitet, per Mail an Ihr Studio – ohne Mehraufwand.' },
  { icon: Smartphone, title: 'App & Web', text: 'Eigene iOS- & Android-App plus Browser-Version – ohne Installation nutzbar.' },
];

const PRICING = [
  {
    name: 'Starter',
    price: '49 €',
    period: '/ Monat',
    desc: 'Der digitale Einstieg für Ihr Studio.',
    features: [
      'Web-Küchencheck mit Ihrem Branding',
      'PDF-Protokoll per Mail',
      'Eigene Landingpage & QR-Code',
      'DSGVO-konform (EU)',
    ],
    highlighted: false,
    cta: 'Demo anfragen',
  },
  {
    name: 'Pro',
    price: '99 €',
    period: '/ Monat',
    desc: 'Für Studios, die voll digital auftreten.',
    features: [
      'Alles aus Starter',
      'Eigene App (iOS & Android)',
      'Individuelle Hersteller- & Gerätelisten',
      'Statistik-Dashboard',
      'Priorisierter Support',
    ],
    highlighted: true,
    cta: 'Demo anfragen',
  },
  {
    name: 'Premium',
    price: 'individuell',
    period: '',
    desc: 'Für Ketten & mehrere Standorte.',
    features: [
      'Alles aus Pro',
      'Mehrere Standorte / Filialen',
      'Eigenes App-Icon im Store',
      'Individuelle Anpassungen',
    ],
    highlighted: false,
    cta: 'Kontakt aufnehmen',
  },
];

const FAQ = STUDIO_FAQ;

export default function ForStudios() {
  useEffect(() => {
    document.title = 'Küchenready – Digitale Küchenberatung für Studios';

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'studio-faq-jsonld';
    script.textContent = JSON.stringify(studioFaqJsonLd());
    document.head.appendChild(script);

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      'content',
      'Küchenready für Küchenstudios: Kunden kommen vorbereitet ins Gespräch – Aufmaß, Grundriss, Protokoll. White-Label, DSGVO-konform.',
    );

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/85 border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <a href="#top" className="flex items-center gap-2 font-display text-xl font-bold">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white"
              style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
            >
              <LayoutGrid className="h-5 w-5" />
            </span>
            <span>
              Küchen<span style={{ color: BRAND }}>ready</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#vorteile" className="hover:text-slate-900">Vorteile</a>
            <a href="#ablauf" className="hover:text-slate-900">So funktioniert's</a>
            <a href="#preise" className="hover:text-slate-900">Preise</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </nav>
          <Button asChild className="text-white" style={{ backgroundColor: BRAND }}>
            <a href={MAILTO}>Demo anfragen</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <div id="top" className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #2E7D32 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <Section className="pt-16 pb-12 sm:pt-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium mb-6"
                style={{ background: `${BRAND}14`, color: BRAND }}
              >
                <Building2 className="h-4 w-4" />
                Für Küchenstudios
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] text-slate-900">
                Ihre Kunden kommen{' '}
                <span style={{ color: BRAND }}>vorbereitet</span> ins Gespräch.
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-xl">
                Küchenready ist Ihr digitaler Vorbereitungs-Assistent: Kunden erfassen
                zu Hause Aufmaß, Grundriss, Stil und Wunschgeräte – Sie erhalten ein
                fertiges Protokoll noch <strong>vor</strong> dem Termin.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="text-white text-base h-12 px-7" style={{ backgroundColor: BRAND }}>
                  <a href={MAILTO} className="gap-2">
                    <Mail className="h-5 w-5" /> Kostenlose Demo anfragen
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base h-12 px-7 border-slate-300">
                  <Link to="/" target="_blank" className="gap-2">
                    Live ansehen <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" style={{ color: BRAND }} /> DSGVO-konform</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" style={{ color: BRAND }} /> Server in der EU</span>
                <span className="inline-flex items-center gap-1.5"><Palette className="h-4 w-4" style={{ color: BRAND }} /> Eigenes Branding</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200">
                <img src="/marketing/hero-kitchen.png" alt="Digitale Küchenplanung" className="w-full" />
              </div>
              <div className="absolute -bottom-5 -left-5 hidden sm:flex items-center gap-3 rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 px-4 py-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: BRAND }}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-slate-900">Protokoll per Mail</div>
                  <div className="text-slate-500">noch vor dem Termin</div>
                </div>
              </div>
            </motion.div>
          </div>
        </Section>
      </div>

      {/* Problem / Lösung */}
      <Section className="py-16">
        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 p-8">
            <h3 className="font-display text-xl font-bold text-slate-900 mb-4">Ohne Vorbereitung</h3>
            <ul className="space-y-3 text-slate-600">
              {['Kunde kommt ohne Maße und ohne klare Vorstellung', 'Wertvolle Beratungszeit geht für Basisfragen drauf', 'Wichtige Infos fehlen, Folgetermine nötig', 'Schwer vergleichbare, handschriftliche Notizen'].map((t) => (
                <li key={t} className="flex gap-3"><span className="mt-1 text-slate-400">✕</span><span>{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-8 text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}>
            <h3 className="font-display text-xl font-bold mb-4">Mit Küchenready</h3>
            <ul className="space-y-3 text-white/90">
              {['Aufmaß, Grundriss & Wünsche liegen vorab vor', 'Beratung startet direkt mit der Planung', 'Strukturiertes PDF-Protokoll für jeden Termin', 'Qualifizierte, vergleichbare Leads'].map((t) => (
                <li key={t} className="flex gap-3"><CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" /><span>{t}</span></li>
              ))}
            </ul>
          </div>
        </motion.div>
      </Section>

      {/* Ablauf */}
      <Section id="ablauf" className="py-16 bg-slate-50 rounded-[2.5rem]">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">In 3 Schritten zum vorbereiteten Termin</h2>
          <p className="mt-4 text-slate-600">Kein Mehraufwand für Sie – der Kunde erledigt die Vorbereitung selbst.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div key={s.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }} className="relative rounded-2xl bg-white border border-slate-200 p-7">
              <div className="absolute -top-4 left-7 h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: BRAND }}>{i + 1}</div>
              <s.icon className="h-8 w-8 mt-3 mb-4" style={{ color: BRAND }} />
              <h3 className="font-semibold text-lg text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Vorteile */}
      <Section id="vorteile" className="py-20">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">Was Ihr Studio davon hat</h2>
          <p className="mt-4 text-slate-600">Mehr Abschlüsse, weniger Aufwand, ein moderner Auftritt.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b, i) => (
            <motion.div key={b.title} {...fadeUp} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }} className="rounded-2xl border border-slate-200 p-7 hover:shadow-lg hover:border-slate-300 transition">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${BRAND}14` }}>
                <b.icon className="h-6 w-6" style={{ color: BRAND }} />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">{b.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{b.text}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Features + Screens */}
      <Section className="py-16 bg-slate-50 rounded-[2.5rem]">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-8">Alles drin, was die Beratung beschleunigt</h2>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-3">
                  <f.icon className="h-6 w-6 shrink-0 mt-0.5" style={{ color: BRAND }} />
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{f.title}</h3>
                    <p className="text-slate-600 text-sm">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div {...fadeUp} className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-200 bg-white">
            <img src="/marketing/screens/grundriss.png" alt="Grundriss-Editor" className="w-full" />
          </motion.div>
        </div>
      </Section>

      {/* Einblicke / Screenshots */}
      <Section className="py-20">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">So erleben es Ihre Kunden</h2>
          <p className="mt-4 text-slate-600">Echte Einblicke in den Küchencheck – im Browser und als App, in Ihrem Branding.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { src: '/marketing/screens/stil.png', t: 'Stil & Design' },
            { src: '/marketing/screens/grundriss.png', t: 'Grundriss-Editor' },
            { src: '/marketing/screens/uebersicht.png', t: 'Protokoll-Übersicht' },
          ].map((s) => (
            <motion.div key={s.t} {...fadeUp} className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white">
              <div className="flex items-center gap-1.5 px-4 h-9 bg-slate-100 border-b border-slate-200">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </div>
              <img src={s.src} alt={s.t} className="w-full" />
              <div className="px-4 py-3 text-sm font-medium text-slate-700">{s.t}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Preise */}
      <Section id="preise" className="py-20">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-4">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">Faire, planbare Preise</h2>
          <p className="mt-4 text-slate-600">Monatlich kündbar. Keine versteckten Kosten.</p>
        </motion.div>
        <p className="text-center text-xs text-slate-400 mb-10">Preisvorschlag – wird individuell mit Ihnen abgestimmt.</p>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PRICING.map((p) => (
            <motion.div
              key={p.name}
              {...fadeUp}
              className={`rounded-2xl p-8 border ${p.highlighted ? 'shadow-xl' : 'border-slate-200'}`}
              style={p.highlighted ? { borderColor: BRAND, boxShadow: `0 20px 40px -20px ${BRAND}66` } : {}}
            >
              {p.highlighted && (
                <div className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: BRAND }}>
                  Beliebt
                </div>
              )}
              <h3 className="font-display text-xl font-bold text-slate-900">{p.name}</h3>
              <p className="text-slate-500 text-sm mt-1 mb-5">{p.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">{p.price}</span>
                <span className="text-slate-500">{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: BRAND }} /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className={`w-full ${p.highlighted ? 'text-white' : ''}`} variant={p.highlighted ? 'default' : 'outline'} style={p.highlighted ? { backgroundColor: BRAND } : {}}>
                <a href={MAILTO}>{p.cta}</a>
              </Button>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Trust */}
      <Section className="py-12">
        <motion.div {...fadeUp} className="rounded-2xl border border-slate-200 p-8 flex flex-col sm:flex-row items-center gap-6 justify-center text-center sm:text-left">
          <ShieldCheck className="h-12 w-12 shrink-0" style={{ color: BRAND }} />
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900">Datenschutz „Made in EU"</h3>
            <p className="text-slate-600 mt-1 max-w-2xl">
              Daten werden DSGVO-konform auf Servern in der EU verarbeitet. Einwilligung ist
              integriert, jedes Studio erhält eigene Impressums- und Datenschutzseiten.
            </p>
          </div>
        </motion.div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="py-16">
        <motion.div {...fadeUp} className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-10">Häufige Fragen</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-slate-900 font-medium">{item.q}</AccordionTrigger>
                <AccordionContent className="text-slate-600">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </Section>

      {/* Final CTA */}
      <Section className="pb-24">
        <motion.div {...fadeUp} className="rounded-3xl p-10 sm:p-14 text-center text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Bereit, Ihre Beratung digital vorzubereiten?</h2>
          <p className="mt-4 text-white/90 max-w-2xl mx-auto">
            Wir zeigen Ihnen Küchenready in 15 Minuten live – unverbindlich und kostenlos.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-white hover:bg-white/90 text-base h-12 px-8" style={{ color: BRAND }}>
              <a href={MAILTO} className="gap-2"><Mail className="h-5 w-5" /> Demo anfragen</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base h-12 px-8 bg-transparent border-white/70 text-white hover:bg-white/10 hover:text-white">
              <Link to="/" target="_blank" className="gap-2">Live ansehen <ArrowRight className="h-5 w-5" /></Link>
            </Button>
          </div>
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-display font-bold text-slate-900">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ backgroundColor: BRAND }}>
              <LayoutGrid className="h-4 w-4" />
            </span>
            Küchen<span style={{ color: BRAND }}>ready</span>
          </div>
          <div className="flex items-center gap-5">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-slate-900">{CONTACT_EMAIL}</a>
            <span aria-hidden>·</span>
            <span>© {new Date().getFullYear()} Küchenready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
