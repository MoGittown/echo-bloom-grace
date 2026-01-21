import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type ExportOptions = {
  filename: string;
  root: HTMLElement;
};

export const A4_MM_W = 210;
export const A4_MM_H = 297;

// A4 in px bei 96dpi
export const A4_PX_W = 794;
export const A4_PX_H = 1123;

function createStage() {
  const stage = document.createElement("div");
  stage.setAttribute("data-pdf-stage", "1");
  stage.style.position = "fixed";
  stage.style.left = "-100000px";
  stage.style.top = "0";
  stage.style.width = `${A4_PX_W}px`;
  stage.style.height = `${A4_PX_H}px`;
  stage.style.background = "#ffffff";
  stage.style.overflow = "hidden";
  stage.style.zIndex = "2147483647";
  stage.style.pointerEvents = "none";
  stage.classList.add("pdf-export");
  document.body.appendChild(stage);
  return stage;
}

function cleanupStage(stage: HTMLElement | null) {
  if (!stage) return;
  stage.remove();
}

/**
 * Canvas wird beim cloneNode oft leer.
 * Fix: Inhalt vom Original-Canvas in den Clone-Canvas kopieren, ohne Layout zu ändern.
 *
 * Matching:
 * 1) per data-pdf-canvas (wenn vorhanden)
 * 2) sonst per Index-Reihenfolge
 */
function copyCanvasContent(source: HTMLElement, clone: HTMLElement) {
  const sourceAll = Array.from(source.querySelectorAll<HTMLCanvasElement>("canvas"));
  const cloneAll = Array.from(clone.querySelectorAll<HTMLCanvasElement>("canvas"));

  const sourceByKey = new Map<string, HTMLCanvasElement>();
  for (const c of sourceAll) {
    const key = c.getAttribute("data-pdf-canvas");
    if (key) sourceByKey.set(key, c);
  }

  for (let i = 0; i < cloneAll.length; i++) {
    const cc = cloneAll[i];
    const key = cc.getAttribute("data-pdf-canvas");

    const oc =
      (key && sourceByKey.get(key)) ||
      sourceAll[i];

    if (!oc) continue;

    try {
      // Canvas Pixelgröße übernehmen
      cc.width = oc.width;
      cc.height = oc.height;

      // CSS Größe übernehmen, damit es im Layout identisch bleibt
      const cs = getComputedStyle(oc);
      cc.style.width = cs.width;
      cc.style.height = cs.height;
      cc.style.display = "block";

      const ctx = cc.getContext("2d");
      if (!ctx) continue;

      ctx.clearRect(0, 0, cc.width, cc.height);
      ctx.drawImage(oc, 0, 0);
    } catch {
      // ignore
    }
  }
}

export async function exportKitchenPdf({ filename, root }: ExportOptions) {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const pages = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-page]"));
  const targets = pages.length ? pages : [root];

  const marginTopMm = 4; // minimaler oberer Rand
  const marginSideMm = 10; // seitlicher Rand
  const marginBottomMm = 4; // minimaler unterer Rand
  const contentW = A4_MM_W - marginSideMm * 2;
  const contentH = A4_MM_H - marginTopMm - marginBottomMm;

  for (let i = 0; i < targets.length; i++) {
    const source = targets[i];

    const stage = createStage();
    const clone = source.cloneNode(true) as HTMLElement;

    // A4 Rahmen, aber Layout-Spacing NICHT zerstören
    clone.style.width = `${A4_PX_W}px`;
    clone.style.minHeight = `${A4_PX_H}px`;
    clone.style.background = "#ffffff";

    // wichtig: nicht hidden, sonst kappen Cards/Canvas gerne
    clone.style.overflow = "visible";

    // NICHT padding:0 setzen
    // NICHT height:1123 festnageln (führt zu Clipping)
    stage.appendChild(clone);

    // Fonts laden lassen
    try {
      await document.fonts?.ready;
    } catch {
      // ignore
    }

    // Canvas Inhalte kopieren
    copyCanvasContent(source, clone);

    // 2 Frames warten, damit Canvas Draw sicher sitzt
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    // Screenshot vom Clone, nicht vom Stage
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
      logging: false,
      foreignObjectRendering: false,
      imageTimeout: 15000,
    });

    cleanupStage(stage);

    const imgData = canvas.toDataURL("image/png");
    if (i > 0) pdf.addPage();

    // immer auf A4 Content-Bereich skalieren
    let renderW = contentW;
    let renderH = (canvas.height * renderW) / canvas.width;

    if (renderH > contentH) {
      renderH = contentH;
      renderW = (canvas.width * renderH) / canvas.height;
    }

    const x = marginSideMm + (contentW - renderW) / 2;
    const y = marginTopMm; // Inhalt direkt am oberen Rand beginnen

    pdf.addImage(imgData, "PNG", x, y, renderW, renderH, undefined, "FAST");
  }

  pdf.save(filename);
}
