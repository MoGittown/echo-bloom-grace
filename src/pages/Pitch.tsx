import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  LayoutGrid,
  Palette,
  QrCode,
  Smartphone,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Internes Pitch-Deck (nicht öffentlich verlinkt). Grüner Marken-Look.
// Bedienung: Pfeiltasten / Klick auf Pfeile. "PDF" = window.print() (jede Folie = eine Seite).
const BRAND = '#2E7D32';
const BRAND_LIGHT = '#3D8B4A';
const CONTACT_EMAIL = 'kontakt@kuechenready.de';

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold ${className}`}>
      <span
        className="inline-flex items-center justify-center rounded-xl text-white h-[1.4em] w-[1.4em]"
        style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}
      >
        <LayoutGrid className="h-[0.8em] w-[0.8em]" />
      </span>
      <span>
        Küchen<span style={{ color: BRAND }}>ready</span>
      </span>
    </span>
  );
}

function Slide({
  children,
  className = '',
  tinted = false,
}: {
  children: React.ReactNode;
  className?: string;
  tinted?: boolean;
}) {
  return (
    <div
      className={`slide-page w-full h-full flex flex-col justify-center px-10 sm:px-20 py-16 ${className}`}
      style={tinted ? { background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})`, color: 'white' } : { background: 'white' }}
    >
      {children}
    </div>
  );
}

function Kicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold mb-6 self-start"
      style={light ? { background: 'rgba(255,255,255,0.18)', color: 'white' } : { background: `${BRAND}14`, color: BRAND }}
    >
      {children}
    </div>
  );
}

const BENEFITS = [
  { icon: BarChart3, big: 'Mehr', small: 'Abschlüsse', text: 'Vorbereitete Kunden entscheiden schneller.' },
  { icon: Clock, big: '−30%', small: 'Beratungszeit', text: 'Keine Basisfragen mehr – direkt zur Planung.' },
  { icon: Users, big: 'Bessere', small: 'Leads', text: 'Budget, Zeitrahmen & Wünsche schon vorab.' },
];

function buildSlides(): React.ReactNode[] {
  return [
    // 1 – Titel
    <Slide key="title" className="items-center text-center">
      <Wordmark className="text-4xl sm:text-5xl mb-8" />
      <h1 className="font-display text-4xl sm:text-6xl font-bold text-slate-900 max-w-4xl leading-tight">
        Digitale Beratungs­vorbereitung für Küchenstudios
      </h1>
      <p className="mt-6 text-xl text-slate-500 max-w-2xl">
        Ihre Kunden kommen vorbereitet ins Gespräch – mit Aufmaß, Grundriss und Wunschküche im Protokoll.
      </p>
      <p className="mt-10 text-sm text-slate-400">kuechenready.de · {CONTACT_EMAIL}</p>
    </Slide>,

    // 2 – Problem
    <Slide key="problem">
      <Kicker>Das Problem</Kicker>
      <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 max-w-3xl leading-tight">
        Beratungszeit ist teuer – und verpufft bei unvorbereiteten Kunden.
      </h2>
      <ul className="mt-10 grid sm:grid-cols-2 gap-x-12 gap-y-5 max-w-4xl text-lg text-slate-600">
        {[
          'Kunde kommt ohne Maße und ohne klare Vorstellung',
          'Viel Zeit geht für das Abfragen von Basisdaten drauf',
          'Wichtige Infos fehlen → zusätzliche Folgetermine',
          'Handschriftliche, schwer vergleichbare Notizen',
        ].map((t) => (
          <li key={t} className="flex gap-3">
            <span className="text-slate-300 text-2xl leading-none">✕</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Slide>,

    // 3 – Lösung
    <Slide key="solution" tinted>
      <Kicker light>Die Lösung</Kicker>
      <h2 className="font-display text-3xl sm:text-5xl font-bold max-w-3xl leading-tight">
        Küchenready bereitet das Gespräch vor – bevor es beginnt.
      </h2>
      <ul className="mt-10 grid sm:grid-cols-2 gap-x-12 gap-y-5 max-w-4xl text-lg text-white/95">
        {[
          'Kunde erfasst Aufmaß, Grundriss & Wünsche von zu Hause',
          'Sie erhalten ein strukturiertes PDF-Protokoll vor dem Termin',
          'Beratung startet direkt mit der Planung',
          'Komplett in Ihrem Branding – als App & im Browser',
        ].map((t) => (
          <li key={t} className="flex gap-3">
            <CheckCircle2 className="h-6 w-6 mt-0.5 shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Slide>,

    // 4 – Ablauf
    <Slide key="ablauf">
      <Kicker>So funktioniert's</Kicker>
      <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 mb-12">In 3 Schritten</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: QrCode, t: 'Link / QR-Code teilen', d: 'Bei Anfrage oder Terminbestätigung – per Mail, WhatsApp oder im Laden.' },
          { icon: Smartphone, t: 'Kunde bereitet vor', d: 'Aufmaß, Grundriss, Stil & Geräte – entspannt zu Hause in Minuten.' },
          { icon: FileText, t: 'Protokoll erhalten', d: 'Strukturiertes PDF inkl. Fotos – noch vor dem Termin im Postfach.' },
        ].map((s, i) => (
          <div key={s.t} className="relative rounded-2xl border border-slate-200 p-7">
            <div className="absolute -top-4 left-7 h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: BRAND }}>{i + 1}</div>
            <s.icon className="h-9 w-9 mt-3 mb-4" style={{ color: BRAND }} />
            <h3 className="font-semibold text-xl text-slate-900 mb-2">{s.t}</h3>
            <p className="text-slate-600">{s.d}</p>
          </div>
        ))}
      </div>
    </Slide>,

    // 5 – Produkt
    <Slide key="product">
      <Kicker>Das Produkt</Kicker>
      <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 mb-10">App & Web – in Ihrem Branding</h2>
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <img src="/marketing/screens/grundriss.png" alt="Grundriss-Editor" className="rounded-2xl shadow-xl ring-1 ring-slate-200 w-full" />
        <div className="space-y-4 text-lg text-slate-600">
          {[
            'Interaktiver Grundriss-Editor (Wände, Fenster, Anschlüsse)',
            'Stil-, Front- & Geräteauswahl',
            'Foto-Upload der Räume',
            'Automatisches PDF-Protokoll per Mail',
            'Eigene iOS- & Android-App plus Browser-Version',
          ].map((t) => (
            <div key={t} className="flex gap-3"><CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" style={{ color: BRAND }} /><span>{t}</span></div>
          ))}
        </div>
      </div>
    </Slide>,

    // 6 – Nutzen / ROI
    <Slide key="roi">
      <Kicker>Ihr Nutzen</Kicker>
      <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 mb-12">Mehr Umsatz, weniger Aufwand</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {BENEFITS.map((b) => (
          <div key={b.small} className="rounded-2xl p-8 text-center border border-slate-200">
            <b.icon className="h-10 w-10 mx-auto mb-4" style={{ color: BRAND }} />
            <div className="font-display text-4xl font-bold text-slate-900">{b.big}</div>
            <div className="font-semibold text-slate-900 mb-3">{b.small}</div>
            <p className="text-slate-600 text-sm">{b.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-400">Schon ein zusätzlicher Küchenabschluss pro Jahr finanziert die Lösung um ein Vielfaches.</p>
    </Slide>,

    // 7 – White-Label
    <Slide key="whitelabel" tinted>
      <Kicker light>White-Label</Kicker>
      <h2 className="font-display text-3xl sm:text-5xl font-bold max-w-3xl leading-tight">Komplett unter Ihrem Namen</h2>
      <div className="mt-10 grid sm:grid-cols-2 gap-x-12 gap-y-5 max-w-4xl text-lg text-white/95">
        {[
          { icon: Palette, t: 'Ihr Logo & Ihre Farbe – passend zur Studio-Website' },
          { icon: Smartphone, t: 'Eigene App-Präsenz für iOS & Android' },
          { icon: FileText, t: 'Eigene Impressums- & Datenschutzseiten' },
          { icon: BarChart3, t: 'Statistik-Dashboard für Ihr Studio' },
        ].map((x) => (
          <div key={x.t} className="flex gap-3 items-start"><x.icon className="h-6 w-6 mt-0.5 shrink-0" /><span>{x.t}</span></div>
        ))}
      </div>
    </Slide>,

    // 8 – Preise
    <Slide key="pricing">
      <Kicker>Preise</Kicker>
      <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 mb-2">Planbar & monatlich kündbar</h2>
      <p className="text-slate-400 text-sm mb-10">Preisvorschlag – wird individuell abgestimmt.</p>
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {[
          { n: 'Starter', p: '49 €', sub: 'Web-Check, PDF, Landing/QR, DSGVO' },
          { n: 'Pro', p: '99 €', sub: '+ eigene App, Hersteller-Listen, Statistik', hot: true },
          { n: 'Premium', p: 'individuell', sub: 'Mehrere Standorte, eigenes App-Icon', big: true },
        ].map((t) => (
          <div key={t.n} className={`rounded-2xl p-7 border ${t.hot ? 'shadow-xl' : 'border-slate-200'}`} style={t.hot ? { borderColor: BRAND } : {}}>
            {t.hot && <div className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: BRAND }}>Beliebt</div>}
            <h3 className="font-display text-xl font-bold text-slate-900">{t.n}</h3>
            <div className="my-3">
              <span className={`font-bold text-slate-900 ${t.big ? 'text-2xl' : 'text-4xl'}`}>{t.p}</span>
              {!t.big && <span className="text-slate-500"> / Monat</span>}
            </div>
            <p className="text-slate-600 text-sm">{t.sub}</p>
          </div>
        ))}
      </div>
    </Slide>,

    // 9 – Pilot
    <Slide key="pilot" className="items-center text-center">
      <Kicker>Status</Kicker>
      <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 max-w-3xl leading-tight">
        Aktuell in der Pilotphase
      </h2>
      <p className="mt-6 text-xl text-slate-500 max-w-2xl">
        Erprobt mit einem ersten Küchenstudio. Wir suchen Pilotpartner, die als Erste digital
        durchstarten – mit Sonderkonditionen und ohne Einrichtungsgebühr.
      </p>
    </Slide>,

    // 10 – CTA
    <Slide key="cta" tinted className="items-center text-center">
      <Wordmark className="text-3xl mb-8" />
      <h2 className="font-display text-4xl sm:text-6xl font-bold leading-tight">Lassen Sie uns starten.</h2>
      <p className="mt-6 text-xl text-white/90 max-w-2xl">
        15 Minuten Live-Demo – unverbindlich. Danach sind Sie in wenigen Tagen startklar.
      </p>
      <p className="mt-10 text-lg font-medium">{CONTACT_EMAIL} · kuechenready.de</p>
    </Slide>,
  ];
}

export default function Pitch() {
  const slides = buildSlides();
  const [active, setActive] = useState(0);
  const total = slides.length;

  useEffect(() => {
    document.title = 'Küchenready – Pitch';
  }, []);

  const next = useCallback(() => setActive((a) => Math.min(a + 1, total - 1)), [total]);
  const prev = useCallback(() => setActive((a) => Math.max(a - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  return (
    <div className="bg-slate-100 min-h-screen print:bg-white">
      {/* Print-Styles: jede Folie = eine A4-Querformat-Seite */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          .deck-chrome { display: none !important; }
          .slide-frame { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; height: 100vh !important; break-after: page; }
          .slide-screen-hidden { display: block !important; }
        }
      `}</style>

      {/* Bildschirm: aktive Folie */}
      <div className="deck-chrome max-w-6xl mx-auto px-4 pt-6 flex items-center justify-between">
        <Wordmark className="text-lg" />
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Als PDF speichern
        </Button>
      </div>

      <div className="deck-chrome max-w-6xl mx-auto px-4 py-6">
        <div className="slide-frame relative bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-200 aspect-[16/9]">
          {slides[active]}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          <Button variant="ghost" onClick={prev} disabled={active === 0} className="gap-1">
            <ChevronLeft className="h-5 w-5" /> Zurück
          </Button>
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Folie ${i + 1}`}
                className="h-2.5 rounded-full transition-all"
                style={{ width: i === active ? 26 : 10, background: i === active ? BRAND : '#cbd5e1' }}
              />
            ))}
          </div>
          <Button variant="ghost" onClick={next} disabled={active === total - 1} className="gap-1">
            Weiter <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">Folie {active + 1} / {total} · Pfeiltasten zum Blättern</p>
      </div>

      {/* Druck: alle Folien hintereinander (nur im Print sichtbar) */}
      <div className="slide-screen-hidden hidden">
        {slides.map((s, i) => (
          <div key={i} className="slide-frame aspect-[16/9]">{s}</div>
        ))}
      </div>
    </div>
  );
}
