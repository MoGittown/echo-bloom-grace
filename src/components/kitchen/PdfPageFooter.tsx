interface PdfPageFooterProps {
  pageNumber: number;
  totalPages: number;
  contactLine?: string;
  studioName?: string;
}

/**
 * Professional footer for each PDF page with page numbers and contact info.
 * Optimized for print quality with proper spacing.
 */
export function PdfPageFooter({
  pageNumber,
  totalPages,
  contactLine,
  studioName,
}: PdfPageFooterProps) {
  return (
    <footer className="pdf-footer">
      <div className="truncate max-w-[65%]">
        {contactLine || studioName || ''}
      </div>
      <div className="page-number">
        Seite {pageNumber} von {totalPages}
      </div>
    </footer>
  );
}
