import { useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  LayoutGrid,
  Palette,
  QrCode,
  ShieldCheck,
  Smartphone,
  Users,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Internes One-Pager-Leave-Behind (nicht öffentlich verlinkt).
// "Als PDF speichern" → window.print() (eine A4-Hochformat-Seite).
const BRAND = '#2E7D32';
const BRAND_LIGHT = '#3D8B4A';
const CONTACT_EMAIL = 'kontakt@kuechenready.de';

const STEPS = [
  { icon: QrCode, t: 'Link / QR teilen', d: 'Bei Anfrage oder Terminbestätigung.' },
  { icon: Smartphone, t: 'Kunde bereitet vor', d: 'Aufmaß, Grundriss, Stil & Geräte – zu Hause.' },
  { icon: FileText, t: 'Protokoll erhalten', d: 'Strukturiertes PDF vor dem Termin.' },
];

const BENEFITS = [
  { icon: BarChart3, t: 'Höhere Abschlussquote' },
  { icon: Clock, t: 'Weniger Beratungszeit' },
  { icon: Users, t: 'Qualifizierte Leads' },
  { icon: Palette, t: 'Komplett Ihr Branding' },
  { icon: Smartphone, t: 'Eigene App & Web' },
  { icon: ShieldCheck, t: 'DSGVO-konform (EU)' },
];

export default function OnePager() {
  useEffect(() => {
    document.title = 'Küchenready – One-Pager';
  }, []);

  return (
    <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; width: auto !important; }
        }
      `}</style>

      <div className="no-print max-w-[210mm] mx-auto px-4 mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Als PDF speichern
        </Button>
      </div>

      <div className="sheet bg-white mx-auto w-[210mm] max-w-full shadow-2xl px-10 py-9 text-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 font-display text-2xl font-bold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}>
                <LayoutGrid className="h-5 w-5" />
              </span>
              Küchen<span style={{ color: BRAND }}>ready</span>
            </div>
            <p className="mt-2 text-slate-500">Digitale Beratungsvorbereitung für Küchenstudios</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div className="font-medium text-slate-700">kuechenready.de</div>
            <div>{CONTACT_EMAIL}</div>
          </div>
        </div>

        {/* Claim */}
        <div className="mt-6">
          <h1 className="font-display text-3xl font-bold text-slate-900 leading-tight">
            Ihre Kunden kommen <span style={{ color: BRAND }}>vorbereitet</span> ins Gespräch.
          </h1>
          <p className="mt-3 text-slate-600">
            Mit Küchenready erfassen Ihre Kunden zu Hause Aufmaß, Grundriss, Stil und Wunschgeräte.
            Sie erhalten ein fertiges PDF-Protokoll noch <strong>vor</strong> dem Termin – als App und im Browser,
            komplett in Ihrem Branding.
          </p>
        </div>

        {/* Schritte */}
        <div className="mt-7 grid grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: BRAND }}>{i + 1}</span>
                <s.icon className="h-5 w-5" style={{ color: BRAND }} />
              </div>
              <div className="font-semibold text-slate-900 text-sm">{s.t}</div>
              <div className="text-slate-600 text-xs mt-1">{s.d}</div>
            </div>
          ))}
        </div>

        {/* Nutzen */}
        <div className="mt-7">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-3">Was Ihr Studio davon hat</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            {BENEFITS.map((b) => (
              <div key={b.t} className="flex items-center gap-2.5 text-sm text-slate-700">
                <b.icon className="h-5 w-5 shrink-0" style={{ color: BRAND }} /> {b.t}
              </div>
            ))}
          </div>
        </div>

        {/* Preise */}
        <div className="mt-7">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Preise</h2>
          <p className="text-xs text-slate-400 mb-3">Vorschlag – wird individuell abgestimmt. Monatlich kündbar.</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: 'Starter', p: '49 € / Mon.', s: 'Web-Check, PDF, Landing/QR' },
              { n: 'Pro', p: '99 € / Mon.', s: '+ App, Hersteller, Statistik', hot: true },
              { n: 'Premium', p: 'individuell', s: 'Mehrere Standorte' },
            ].map((t) => (
              <div key={t.n} className="rounded-xl border p-4" style={t.hot ? { borderColor: BRAND, background: `${BRAND}0a` } : { borderColor: '#e2e8f0' }}>
                <div className="font-semibold text-slate-900">{t.n}</div>
                <div className="font-bold text-slate-900 my-1">{t.p}</div>
                <div className="text-xs text-slate-600">{t.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-7 rounded-xl px-6 py-5 text-white flex items-center justify-between gap-4" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}>
          <div>
            <div className="font-display text-lg font-bold">Kostenlose Live-Demo in 15 Minuten</div>
            <div className="text-white/90 text-sm">Unverbindlich – in wenigen Tagen startklar.</div>
          </div>
          <div className="text-right text-sm font-medium shrink-0">
            <div>{CONTACT_EMAIL}</div>
            <div>kuechenready.de</div>
          </div>
        </div>

        <p className="mt-5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Daten DSGVO-konform auf Servern in der EU · White-Label unter Ihrem Namen
        </p>
      </div>
    </div>
  );
}
