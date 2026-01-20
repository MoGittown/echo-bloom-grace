# PDF-Erstellung - Code Dokumentation

## Übersicht

Die PDF-Generierung nutzt **jsPDF** und **html2canvas** um die Zusammenfassungsseiten als Bilder zu rendern und in ein A4-PDF zu exportieren.

---

## 1. Hauptfunktion: handleDownloadPDF

**Datei:** `src/components/kitchen/SummaryView.tsx` (Zeilen 425-588)

```typescript
const handleDownloadPDF = useCallback(async () => {
  if (!summaryRef.current) return;

  setIsGenerating(true);
  clearPdfDebug();

  try {
    const root = summaryRef.current;
    const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-pdf-page]'));

    // Fallback: export the whole summary as a long image
    const exportTargets = pages.length > 0 ? pages : [root as unknown as HTMLElement];

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // A4 at ~96 DPI (used for stable html2canvas sizing)
    const A4_PX_W = 794;
    const A4_PX_H = Math.round((A4_PX_W * 297) / 210);

    console.log(`[PDF Debug] Starting export of ${exportTargets.length} pages`);
    addPdfDebugEvent('info', `PDF-Export gestartet (${exportTargets.length} Seiten)`);

    for (let i = 0; i < exportTargets.length; i++) {
      const target = exportTargets[i];
      const pageLabel = target.getAttribute('data-pdf-page') || `page-${i + 1}`;

      const dimLine = `DOM: ${target.offsetWidth}x${target.offsetHeight}px`;
      const textLen = target.textContent?.length || 0;

      console.log(`[PDF Debug] Processing page ${i + 1}/${exportTargets.length}: "${pageLabel}"`);
      console.log(`[PDF Debug] Page dimensions: ${target.offsetWidth}x${target.offsetHeight}px`);
      console.log(`[PDF Debug] Page text content length: ${textLen} chars`);

      addPdfDebugEvent(
        'info',
        `Seite ${i + 1}/${exportTargets.length}: ${pageLabel}`,
        `${dimLine}\nText: ${textLen} Zeichen`,
      );

      try {
        const canvas = await html2canvas(target, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          foreignObjectRendering: false,
          imageTimeout: 15000,
          onclone: (doc) => {
            // Inject aggressive CSS to prevent letter-spacing / kerning bugs in html2canvas
            const fixStyle = doc.createElement('style');
            fixStyle.textContent = `
              * {
                letter-spacing: 0 !important;
                word-spacing: 0 !important;
                text-transform: none !important;
                font-kerning: none !important;
                font-variant-ligatures: none !important;
                text-rendering: geometricPrecision !important;
                -webkit-font-smoothing: antialiased !important;
              }
            `;
            doc.head.appendChild(fixStyle);

            doc.body.style.background = '#ffffff';
            doc.body.style.margin = '0';
            doc.body.style.width = `${A4_PX_W}px`;
            doc.body.style.minHeight = `${A4_PX_H}px`;

            // Keep SVG icons visible
            const svgs = doc.querySelectorAll('svg');
            svgs.forEach((svg) => {
              svg.style.display = 'inline-block';
            });

            // Aggressively normalize text nodes to prevent IndexSizeError
            const normalizeText = (s: string): string => {
              return s
                // Remove zero-width and invisible formatting characters
                .replace(/[\u200B-\u200D\u2060\uFE0E\uFE0F\u202A-\u202E\u00AD\uFEFF]/g, '')
                // Remove variation selectors
                .replace(/[\uFE00-\uFE0F]/g, '')
                // Replace smart quotes with ASCII equivalents
                .replace(/[\u2018\u2019\u201A]/g, "'")
                .replace(/[\u201C\u201D\u201E]/g, '"')
                // Replace dashes
                .replace(/[\u2013\u2014\u2015]/g, '-')
                // Replace ellipsis
                .replace(/\u2026/g, '...')
                // Remove any remaining surrogate pairs (emoji) that might cause issues
                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
            };

            let changed = 0;
            const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
            let node: Node | null = walker.nextNode();
            while (node) {
              const textNode = node as Text;
              const original = textNode.nodeValue ?? '';
              const cleaned = normalizeText(original);
              if (cleaned !== original) {
                textNode.nodeValue = cleaned;
                changed++;
              }
              node = walker.nextNode();
            }

            // Force layout recalculation before html2canvas measures
            void doc.body.offsetHeight;

            if (changed > 0) {
              addPdfDebugEvent('info', `Text normalisiert (${pageLabel})`, `${changed} Textknoten bereinigt`);
            }
          },
        });

        console.log(`[PDF Debug] ✓ Page ${i + 1} canvas created: ${canvas.width}x${canvas.height}px`);
        addPdfDebugEvent('success', `Seite ${i + 1} gerendert`, `Canvas: ${canvas.width}x${canvas.height}px`);

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) pdf.addPage();

        // Fit image into A4 while preserving aspect ratio
        let renderW = pageW;
        let renderH = (canvas.height * renderW) / canvas.width;
        if (renderH > pageH) {
          renderH = pageH;
          renderW = (canvas.width * renderH) / canvas.height;
        }
        const x = (pageW - renderW) / 2;
        pdf.addImage(imgData, 'PNG', x, 0, renderW, renderH);
      } catch (pageError) {
        console.error(`[PDF Debug] ✗ Page ${i + 1} ("${pageLabel}") FAILED:`, pageError);
        addPdfDebugEvent('error', `Seite ${i + 1} fehlgeschlagen (${pageLabel})`, formatUnknownError(pageError));
        setPdfDebugOpen(true);
        throw pageError;
      }
    }

    console.log(`[PDF Debug] ✓ All pages processed successfully`);
    addPdfDebugEvent('success', 'Alle Seiten erfolgreich verarbeitet');

    const fileName = `Kuechen-Beratung_${project.customer.lastName || 'Kunde'}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    console.log(`[PDF Debug] ✓ PDF saved as: ${fileName}`);
    addPdfDebugEvent('success', `PDF gespeichert: ${fileName}`);
  } catch (error) {
    console.error('PDF generation failed:', error);
    addPdfDebugEvent('error', 'PDF-Generierung fehlgeschlagen', formatUnknownError(error));
    setPdfDebugOpen(true);
    toast.error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  } finally {
    setIsGenerating(false);
  }
}, [project, addPdfDebugEvent, clearPdfDebug, formatUnknownError]);
```

---

## 2. PdfPageHeader Komponente

**Datei:** `src/components/kitchen/PdfPageHeader.tsx`

```typescript
import { FileText } from 'lucide-react';

interface PdfPageHeaderProps {
  protocolId: string;
  createdDate: string;
  customerName?: string;
  studioName?: string;
  logoUrl?: string | null;
}

export function PdfPageHeader({
  protocolId,
  createdDate,
  customerName,
  studioName,
  logoUrl,
}: PdfPageHeaderProps) {
  return (
    <header className="pdf-header">
      {/* Left: Logo + Studio */}
      <div className="pdf-header-logo">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={studioName || 'Studio Logo'}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
        )}
        {studioName && (
          <span className="studio-name">{studioName}</span>
        )}
      </div>

      {/* Center: Title */}
      <div className="pdf-header-title">
        <h1>Kuechen-Planungsprotokoll</h1>
        <div className="subtitle">Beratungsdokumentation</div>
      </div>

      {/* Right: Meta */}
      <div className="pdf-header-meta">
        <div>Protokoll-Nr.: <span className="value">{protocolId}</span></div>
        <div>Erstellt: <span className="value">{createdDate}</span></div>
        {customerName && (
          <div>Kunde: <span className="value">{customerName}</span></div>
        )}
      </div>
    </header>
  );
}
```

---

## 3. PdfPageFooter Komponente

**Datei:** `src/components/kitchen/PdfPageFooter.tsx`

```typescript
interface PdfPageFooterProps {
  pageNumber: number;
  totalPages: number;
  contactLine?: string;
  studioName?: string;
}

export function PdfPageFooter({
  pageNumber,
  totalPages,
  contactLine,
  studioName,
}: PdfPageFooterProps) {
  return (
    <footer className="pdf-footer">
      <div className="truncate max-w-[70%]">
        {contactLine || studioName || ''}
      </div>
      <div className="page-number">
        Seite {pageNumber} / {totalPages}
      </div>
    </footer>
  );
}
```

---

## 4. PdfDebugConsole Komponente

**Datei:** `src/components/kitchen/PdfDebugConsole.tsx`

```typescript
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2 } from "lucide-react";

export type PdfDebugLevel = "info" | "success" | "error";

export type PdfDebugEvent = {
  ts: number;
  level: PdfDebugLevel;
  message: string;
  details?: string;
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function levelToVariant(level: PdfDebugLevel): "outline" | "secondary" | "destructive" {
  if (level === "error") return "destructive";
  if (level === "success") return "secondary";
  return "outline";
}

export function PdfDebugConsole({
  open,
  onOpenChange,
  events,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: PdfDebugEvent[];
  onClear: () => void;
}) {
  const handleCopy = async () => {
    const text = events
      .map((e) => {
        const details = e.details ? `\n${e.details}` : "";
        return `[${formatTime(e.ts)}] ${e.level.toUpperCase()}: ${e.message}${details}`;
      })
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>PDF Debug-Konsole</DialogTitle>
          <DialogDescription>
            Zeigt die Schritte der PDF-Erstellung (Seiten, Render-Status und Fehlerdetails).
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border">
          <ScrollArea className="h-[360px]">
            <div className="p-3 space-y-3">
              {events.length === 0 ? (
                <div className="text-sm text-muted-foreground">Noch keine Debug-Einträge.</div>
              ) : (
                events.map((e, idx) => (
                  <div key={idx} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium break-words">{e.message}</div>
                        {e.details ? (
                          <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-muted p-2 text-xs text-muted-foreground">
                            {e.details}
                          </pre>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground font-mono">{formatTime(e.ts)}</span>
                        <Badge variant={levelToVariant(e.level)}>{e.level}</Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Kopieren
          </Button>
          <Button type="button" variant="outline" onClick={onClear} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Leeren
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. CSS Design System

**Datei:** `src/index.css` (Zeilen 141-360)

```css
/* PDF Page Container */
.pdf-page {
  @apply bg-white p-6 flex flex-col min-h-[1100px];
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 10pt;
  line-height: 1.4;
  color: hsl(var(--foreground));
}

/* PDF Header - Clean professional look */
.pdf-header {
  @apply flex items-center justify-between pb-3 mb-4;
  border-bottom: 2px solid hsl(var(--primary));
}

.pdf-header-logo {
  @apply flex items-center gap-3;
}

.pdf-header-logo img {
  @apply h-10 max-w-[120px] object-contain;
}

.pdf-header-logo .studio-name {
  @apply text-lg font-bold text-foreground;
}

.pdf-header-title {
  @apply text-center;
}

.pdf-header-title h1 {
  @apply text-base font-bold text-foreground tracking-tight;
}

.pdf-header-title .subtitle {
  @apply text-xs text-muted-foreground;
}

.pdf-header-meta {
  @apply text-right text-xs text-muted-foreground space-y-0.5;
}

.pdf-header-meta .value {
  @apply font-medium text-foreground;
}

/* PDF Footer - Minimal and elegant */
.pdf-footer {
  @apply flex items-center justify-between pt-3 mt-auto text-[8pt] text-muted-foreground;
  border-top: 1px solid hsl(var(--border) / 0.5);
}

.pdf-footer .page-number {
  @apply font-medium;
}

/* PDF Section Cards - Clean and structured */
.pdf-section {
  @apply rounded-lg border border-border/50 mb-4 overflow-hidden;
  background: hsl(var(--card));
}

.pdf-section-header {
  @apply flex items-center gap-2 px-4 py-2.5 font-semibold text-[10pt];
  background: hsl(var(--muted) / 0.5);
  border-bottom: 1px solid hsl(var(--border) / 0.5);
}

.pdf-section-header svg {
  @apply w-4 h-4 text-primary flex-shrink-0;
}

.pdf-section-body {
  @apply p-4 text-[9pt];
}

/* PDF Data Grid - For key-value pairs */
.pdf-data-grid {
  @apply grid gap-x-6 gap-y-2;
  grid-template-columns: repeat(2, 1fr);
}

.pdf-data-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.pdf-data-grid.cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.pdf-data-item {
  @apply flex flex-col gap-0.5;
}

.pdf-data-label {
  @apply text-[8pt] text-muted-foreground uppercase tracking-wide font-medium;
}

.pdf-data-value {
  @apply text-[9pt] font-medium text-foreground;
}

/* PDF Tags - For multiple values */
.pdf-tag-list {
  @apply flex flex-wrap gap-1;
}

.pdf-tag {
  @apply px-2 py-0.5 rounded text-[8pt] font-medium;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}

.pdf-tag.accent {
  background: hsl(var(--accent) / 0.15);
  color: hsl(var(--accent-foreground));
}

.pdf-tag.muted {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

/* PDF Highlight Box - For important summary data */
.pdf-highlight-box {
  @apply rounded-lg p-4 mb-4;
  background: linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--primary) / 0.02) 100%);
  border: 1px solid hsl(var(--primary) / 0.2);
}

.pdf-highlight-grid {
  @apply grid gap-3;
  grid-template-columns: repeat(4, 1fr);
}

.pdf-highlight-item {
  @apply rounded-lg p-3 text-center;
  background: hsl(var(--background));
  box-shadow: 0 1px 3px hsl(var(--foreground) / 0.05);
}

.pdf-highlight-label {
  @apply text-[7pt] text-muted-foreground uppercase tracking-wider font-medium mb-1 flex items-center justify-center gap-1;
}

.pdf-highlight-value {
  @apply text-[11pt] font-bold text-foreground;
}

.pdf-highlight-sub {
  @apply text-[8pt] text-muted-foreground;
}

/* PDF Table - For structured data */
.pdf-table {
  @apply w-full text-[9pt];
}

.pdf-table th {
  @apply text-left py-2 px-3 font-semibold text-[8pt] uppercase tracking-wide text-muted-foreground;
  background: hsl(var(--muted) / 0.5);
  border-bottom: 1px solid hsl(var(--border));
}

.pdf-table td {
  @apply py-2 px-3 border-b border-border/30;
}

.pdf-table tr:last-child td {
  @apply border-b-0;
}

/* PDF Canvas Container - For drawings */
.pdf-canvas-container {
  @apply flex justify-center p-2 rounded-lg;
  background: hsl(var(--muted) / 0.3);
}

/* PDF Photo Grid */
.pdf-photo-grid {
  @apply grid grid-cols-2 gap-3;
}

.pdf-photo-item {
  @apply rounded-lg overflow-hidden border border-border/50;
}

.pdf-photo-item img {
  @apply w-full h-36 object-cover;
}

.pdf-photo-caption {
  @apply px-2 py-1.5 text-[8pt] text-muted-foreground;
  background: hsl(var(--muted) / 0.5);
}

/* PDF Inline List with Icons */
.pdf-check-list {
  @apply space-y-1.5;
}

.pdf-check-item {
  @apply flex items-start gap-2 text-[9pt];
}

.pdf-check-item svg {
  @apply w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0;
}

/* PDF Two-Column Layout */
.pdf-two-col {
  @apply grid grid-cols-2 gap-4;
}
```

---

## 6. html2canvas Workarounds

**Datei:** `src/index.css` (Zeilen 400-430)

```css
/* PDF Export Styles (used by html2canvas via .pdf-export on cloned DOM) */
.pdf-export * {
  /* Workaround for html2canvas Range/letter-spacing bugs */
  letter-spacing: normal !important;
  font-variant-ligatures: none !important;
  font-kerning: none !important;
}

.pdf-export .kitchen-card {
  box-shadow: none;
}

.pdf-export .kitchen-card,
.pdf-export .p-6 {
  padding: 12px !important;
}

.pdf-export .kitchen-card {
  margin-bottom: 8px !important;
}

.pdf-export .space-y-6 > * {
  margin-bottom: 8px !important;
}

.pdf-export .mt-6 {
  margin-top: 8px !important;
}

.pdf-export .mb-6 {
  margin-bottom: 8px !important;
}
```

---

## 7. Abhängigkeiten

**package.json:**

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1",
    "jspdf": "^4.0.0"
  }
}
```

---

## 8. Bekannte Probleme & Workarounds

### IndexSizeError bei html2canvas
- **Ursache:** Spezielle Unicode-Zeichen (Emojis, Smart Quotes, Zero-Width-Chars)
- **Lösung:** Text-Normalisierung im `onclone` Callback

### Letter-Spacing Bug
- **Ursache:** html2canvas berechnet Textbreiten falsch bei letter-spacing
- **Lösung:** CSS-Reset im geklonten DOM

### SVG-Icons verschwinden
- **Ursache:** html2canvas ignoriert manche SVG-Stile
- **Lösung:** Explizites `display: inline-block` setzen

---

## Dateistruktur

```
src/
├── components/
│   └── kitchen/
│       ├── SummaryView.tsx      (Hauptlogik, Zeilen 425-588)
│       ├── PdfPageHeader.tsx    (Seitenkopf)
│       ├── PdfPageFooter.tsx    (Seitenfuß)
│       └── PdfDebugConsole.tsx  (Debug-Panel)
├── index.css                    (PDF CSS, Zeilen 141-430)
```
