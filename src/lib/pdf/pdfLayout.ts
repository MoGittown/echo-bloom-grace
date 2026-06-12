import type jsPDF from "jspdf";

/** Gemeinsame A4-Maße für Web-Vorschau und PDF-Export */
export const PDF_LAYOUT = {
  A4_MM_W: 210,
  A4_MM_H: 297,
  A4_PX_W: 794,
  A4_PX_H: 1123,
  /** Reservierter Streifen unten — Footer wird nativ gezeichnet, nicht gerastert */
  FOOTER_ZONE_MM: 22,
  MARGIN_X_MM: 10,
  FOOTER_PADDING_PX: 96,
  FOOTER_BOTTOM_PX: 44,
} as const;

export type PdfFooterMeta = {
  contactLine: string;
  pageNumber: number;
  totalPages: number;
};

export function contentHeightMm(): number {
  return PDF_LAYOUT.A4_MM_H - PDF_LAYOUT.FOOTER_ZONE_MM;
}

export function extractFooterMeta(page: HTMLElement): PdfFooterMeta {
  const footer = page.querySelector<HTMLElement>("[data-pdf-footer]");
  const contactLine =
    footer?.dataset.pdfContactLine?.trim() ||
    footer?.querySelector(".pdf-footer-contact")?.textContent?.trim() ||
    "";
  const pageNumber = Number(footer?.dataset.pdfPageNum ?? 1);
  const totalPages = Number(footer?.dataset.pdfPageTotal ?? 1);
  return {
    contactLine,
    pageNumber: Number.isFinite(pageNumber) ? pageNumber : 1,
    totalPages: Number.isFinite(totalPages) ? totalPages : 1,
  };
}

/** Footer als Vektor-Text — scharf und immer sichtbar */
export function drawPdfFooter(pdf: jsPDF, meta: PdfFooterMeta): void {
  const { A4_MM_W, A4_MM_H, MARGIN_X_MM, FOOTER_ZONE_MM } = PDF_LAYOUT;
  const contentBottom = A4_MM_H - FOOTER_ZONE_MM;
  const lineY = contentBottom + 5;
  const textY = contentBottom + 11;
  const rightX = A4_MM_W - MARGIN_X_MM;
  const lineW = A4_MM_W - MARGIN_X_MM * 2;

  pdf.setDrawColor(170, 170, 170);
  pdf.setLineWidth(0.25);
  pdf.line(MARGIN_X_MM, lineY, MARGIN_X_MM + lineW, lineY);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(68, 68, 68);
  if (meta.contactLine) {
    pdf.text(meta.contactLine, MARGIN_X_MM, textY, {
      maxWidth: lineW - 34,
    });
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(17, 17, 17);
  pdf.text(
    `Seite ${meta.pageNumber} von ${meta.totalPages}`,
    rightX,
    textY,
    { align: "right" },
  );
}
