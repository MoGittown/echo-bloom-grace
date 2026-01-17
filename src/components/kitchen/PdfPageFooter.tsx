interface PdfPageFooterProps {
  pageNumber: number;
  totalPages: number;
  contactLine?: string;
  studioName?: string;
}

/**
 * Minimal footer for each PDF page with page numbers and optional contact.
 */
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
