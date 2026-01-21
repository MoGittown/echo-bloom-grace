import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type ExportOptions = {
  filename: string;
  root: HTMLElement;
};

const A4_MM_W = 210;
const A4_MM_H = 297;

// A4 in px bei 96dpi
const A4_PX_W = 794;
const A4_PX_H = 1123;

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
  stage.classList.add("pdf-export");
  document.body.appendChild(stage);
  return stage;
}

function cleanupStage(stage: HTMLElement | null) {
  if (!stage) return;
  stage.remove();
}

export async function exportKitchenPdf({ filename, root }: ExportOptions) {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const pages = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-page]"));
  const targets = pages.length ? pages : [root];

  const pageW = A4_MM_W;
  const pageH = A4_MM_H;

  const marginMm = 12;
  const contentW = pageW - marginMm * 2;
  const contentH = pageH - marginMm * 2;

  for (let i = 0; i < targets.length; i++) {
    const source = targets[i];

    const stage = createStage();

    const clone = source.cloneNode(true) as HTMLElement;

    // A4 Box erzwingen
    clone.style.width = `${A4_PX_W}px`;
    clone.style.height = `${A4_PX_H}px`;
    clone.style.minHeight = `${A4_PX_H}px`;
    clone.style.maxHeight = `${A4_PX_H}px`;
    clone.style.maxWidth = "none";
    clone.style.margin = "0";
    clone.style.padding = "0";
    clone.style.background = "#ffffff";
    clone.style.overflow = "hidden";

    stage.appendChild(clone);

    // typische Layout Limits killen, aber nur im Stage
    const all = Array.from(stage.querySelectorAll<HTMLElement>("*"));
    for (const el of all) {
      const cs = window.getComputedStyle(el);

      if (cs.maxWidth && cs.maxWidth !== "none") el.style.maxWidth = "none";
      if (cs.marginLeft === "auto") el.style.marginLeft = "0";
      if (cs.marginRight === "auto") el.style.marginRight = "0";
    }

    // svg sichtbar halten
    stage.querySelectorAll("svg").forEach((svg) => {
      (svg as SVGElement).style.display = "inline-block";
    });

    // fonts laden lassen
    try {
      await document.fonts?.ready;
    } catch {
      // ignore
    }

    const canvas = await html2canvas(stage, {
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

    let renderW = contentW;
    let renderH = (canvas.height * renderW) / canvas.width;

    if (renderH > contentH) {
      renderH = contentH;
      renderW = (canvas.width * renderH) / canvas.height;
    }

    const x = marginMm + (contentW - renderW) / 2;
    const y = marginMm + (contentH - renderH) / 2;

    pdf.addImage(imgData, "PNG", x, y, renderW, renderH, undefined, "FAST");
  }

  pdf.save(filename);
}

// Export constants for reuse
export { A4_MM_W, A4_MM_H, A4_PX_W, A4_PX_H };
