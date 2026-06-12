import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PDF_LAYOUT,
  contentHeightMm,
  drawPdfFooter,
  extractFooterMeta,
} from "./pdfLayout";

type ExportOptions = {
  filename: string;
  root: HTMLElement;
};

export const A4_MM_W = PDF_LAYOUT.A4_MM_W;
export const A4_MM_H = PDF_LAYOUT.A4_MM_H;
export const A4_PX_W = PDF_LAYOUT.A4_PX_W;
export const A4_PX_H = PDF_LAYOUT.A4_PX_H;

function createStage(heightPx: number) {
  const stage = document.createElement("div");
  stage.setAttribute("data-pdf-stage", "1");
  stage.style.position = "fixed";
  stage.style.left = "-100000px";
  stage.style.top = "0";
  stage.style.width = `${PDF_LAYOUT.A4_PX_W}px`;
  stage.style.height = `${heightPx}px`;
  stage.style.background = "#ffffff";
  stage.style.overflow = "hidden";
  stage.style.zIndex = "2147483647";
  stage.style.pointerEvents = "none";
  stage.classList.add("pdf-export");
  document.body.appendChild(stage);
  return stage;
}

function cleanupStage(stage: HTMLElement | null) {
  stage?.remove();
}

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
    const oc = (key && sourceByKey.get(key)) || sourceAll[i];
    if (!oc) continue;

    try {
      cc.width = oc.width;
      cc.height = oc.height;
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

function preparePageClone(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  clone.classList.add("pdf-export");

  clone.style.width = `${PDF_LAYOUT.A4_PX_W}px`;
  clone.style.height = `${PDF_LAYOUT.A4_PX_H}px`;
  clone.style.minHeight = `${PDF_LAYOUT.A4_PX_H}px`;
  clone.style.maxHeight = `${PDF_LAYOUT.A4_PX_H}px`;
  clone.style.background = "#ffffff";
  clone.style.overflow = "hidden";
  clone.style.boxSizing = "border-box";
  clone.style.position = "relative";

  // Footer wird nativ gezeichnet — nicht rasterisieren
  clone.querySelectorAll<HTMLElement>("[data-pdf-footer]").forEach((el) => {
    el.style.display = "none";
  });

  return clone;
}

/**
 * PDF-Export v2: Seiteninhalt als Bild, Footer als jsPDF-Vektor-Text.
 * Vermeidet abgeschnittene Footer durch html2canvas.
 */
export async function exportKitchenPdf({ filename, root }: ExportOptions) {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pages = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-page]"));
  const targets = pages.length ? pages : [root];
  const contentMm = contentHeightMm();

  for (let i = 0; i < targets.length; i++) {
    const source = targets[i];
    const footerMeta = extractFooterMeta(source);
    const clone = preparePageClone(source);

    const stage = createStage(PDF_LAYOUT.A4_PX_H);
    stage.appendChild(clone);

    try {
      await document.fonts?.ready;
    } catch {
      // ignore
    }

    copyCanvasContent(source, clone);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const canvas = await html2canvas(clone, {
      scale: 2,
      width: PDF_LAYOUT.A4_PX_W,
      height: PDF_LAYOUT.A4_PX_H,
      windowWidth: PDF_LAYOUT.A4_PX_W,
      windowHeight: PDF_LAYOUT.A4_PX_H,
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

    pdf.addImage(imgData, "PNG", 0, 0, PDF_LAYOUT.A4_MM_W, contentMm, undefined, "FAST");
    drawPdfFooter(pdf, footerMeta);
  }

  pdf.save(filename);
}
