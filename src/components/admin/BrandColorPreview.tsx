type Props = {
  primary: string;
  secondary: string;
  accent: string;
};

/**
 * Live-Vorschau der Markenfarben. Rendert eine Mini-Ansicht (Headline, Buttons,
 * Karten, Badge) direkt mit den aktuell im Formular eingestellten Farben –
 * vollständig über Inline-Styles, damit die Vorschau OHNE Speichern sofort auf
 * Änderungen reagiert.
 */
export function BrandColorPreview({ primary, secondary, accent }: Props) {
  const primarySafe = normalizeHex(primary, '#8B7355');
  const secondarySafe = normalizeHex(secondary, '#6B7280');
  const accentSafe = normalizeHex(accent, '#16A34A');

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Live-Vorschau (ohne Speichern)</p>
      <div className="rounded-xl border overflow-hidden">
        <div
          className="px-4 py-3"
          style={{ background: primarySafe, color: foregroundFor(primarySafe) }}
        >
          <div className="text-sm font-semibold">Ihr Küchenstudio</div>
          <div className="text-xs opacity-90">Beratung, die begeistert</div>
        </div>

        <div className="p-4 space-y-3 bg-card">
          <div className="text-base font-semibold" style={{ color: primarySafe }}>
            Willkommen zur Küchenberatung
          </div>
          <p className="text-sm text-muted-foreground">
            So wirken Ihre Farben auf Buttons, Überschriften und Karten.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: primarySafe, color: foregroundFor(primarySafe) }}
            >
              Primär-Button
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: secondarySafe, color: foregroundFor(secondarySafe) }}
            >
              Sekundär
            </button>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium self-center"
              style={{ background: accentSafe, color: foregroundFor(accentSafe) }}
            >
              Akzent-Badge
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-lg p-3 text-xs"
              style={{ border: `1px solid ${primarySafe}`, color: primarySafe }}
            >
              <div className="font-semibold mb-0.5">Karte A</div>
              Rahmen in Primärfarbe
            </div>
            <div
              className="rounded-lg p-3 text-xs"
              style={{ background: hexWithAlpha(accentSafe, 0.12), color: accentSafe }}
            >
              <div className="font-semibold mb-0.5">Karte B</div>
              Fläche in Akzentfarbe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeHex(value: string, fallback: string): string {
  if (!value) return fallback;
  const v = value.trim();
  return /^#?[0-9a-fA-F]{6}$/.test(v) ? (v.startsWith('#') ? v : `#${v}`) : fallback;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

// Wählt schwarze oder weiße Schrift je nach Helligkeit des Hintergrunds.
function foregroundFor(hex: string): string {
  const m = /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m) return '#ffffff';
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
}
