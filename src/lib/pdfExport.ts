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

export async function exportKitchenPdf({ filename, root }: ExportOptions) {
  const pages = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-page]"));
  const targets = pages.length ? pages : [root];

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = A4_MM_W;
  const pageH = A4_MM_H;
  const marginMm = 12;
  const contentW = pageW - marginMm * 2;
  const contentH = pageH - marginMm * 2;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];

    // Markiere das aktuelle Element, damit wir es im Clone sicher finden
    target.setAttribute("data-pdf-capture", "1");

    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
      logging: false,
      foreignObjectRendering: false,
      imageTimeout: 15000,
      onclone: (doc) => {
        doc.body.classList.add("pdf-export");

        // Seite auf A4 ziehen
        doc.documentElement.style.background = "#ffffff";
        doc.body.style.background = "#ffffff";
        doc.body.style.margin = "0";
        doc.body.style.padding = "0";
        doc.body.style.width = `${A4_PX_W}px`;

        const capture = doc.querySelector<HTMLElement>('[data-pdf-capture="1"]');
        if (!capture) return;

        // Capture Root hart auf A4 setzen
        capture.style.width = `${A4_PX_W}px`;
        capture.style.maxWidth = "none";
        capture.style.marginLeft = "0";
        capture.style.marginRight = "0";

        // Entferne typische Layout Limits, die den Inhalt schmal machen
        const all = Array.from(capture.querySelectorAll<HTMLElement>("*"));
        for (const el of all) {
          const cs = doc.defaultView?.getComputedStyle(el);
          if (!cs) continue;

          // max-width Limits raus
          const mw = cs.maxWidth;
          if (mw && mw !== "none" && mw.endsWith("px")) {
            const px = parseFloat(mw);
            if (Number.isFinite(px) && px > 0 && px < A4_PX_W) {
              el.style.maxWidth = "none";
            }
          }

          // Zentrierung durch auto margins killt A4 Breite
          if (cs.marginLeft === "auto") el.style.marginLeft = "0";
          if (cs.marginRight === "auto") el.style.marginRight = "0";

          // Container Breiten
          if (cs.width && cs.width.endsWith("px")) {
            const wpx = parseFloat(cs.width);
            if (Number.isFinite(wpx) && wpx > 0 && wpx < A4_PX_W * 0.85) {
              el.style.width = "100%";
            }
          }
        }

        // SVG Fix
        const svgs = doc.querySelectorAll("svg");
        svgs.forEach((svg) => {
          (svg as SVGElement).style.display = "inline-block";
        });

        // Text Normalisierung gegen html2canvas Bugs
        const normalize = (s: string) =>
          s
            .replace(/[\u200B-\u200D\u2060\uFE0E\uFE0F\u202A-\u202E\u00AD\uFEFF]/g, "")
            .replace(/[\uFE00-\uFE0F]/g, "")
            .replace(/[\u2018\u2019\u201A]/g, "'")
            .replace(/[\u201C\u201D\u201E]/g, '"')
            .replace(/[\u2013\u2014\u2015]/g, "-")
            .replace(/\u2026/g, ".")
            .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");

        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        let n: Node | null = walker.nextNode();
        while (n) {
          const t = n as Text;
          const orig = t.nodeValue ?? "";
          const cleaned = normalize(orig);
          if (cleaned !== orig) t.nodeValue = cleaned;
          n = walker.nextNode();
        }

        void doc.body.offsetHeight;
      },
    });

    target.removeAttribute("data-pdf-capture");

    const imgData = canvas.toDataURL("image/png");
    if (i > 0) pdf.addPage();

    // Fit in Content Box mit Druckrand
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
