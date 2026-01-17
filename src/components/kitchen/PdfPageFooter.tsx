interface PdfPageFooterProps {
  pageNumber: number;
  totalPages: number;
  contactLine?: string;
  studioName?: string;
}

/**
 * Footer for each PDF page with page numbers and studio contact info.
 */
export function PdfPageFooter({
  pageNumber,
  totalPages,
  contactLine,
  studioName,
}: PdfPageFooterProps) {
  return (
    <footer className="flex items-center justify-between px-4 py-1.5 mt-4 border-t border-border/50 text-[9pt] text-muted-foreground">
      <div className="truncate max-w-[75%]">
        {contactLine || studioName || ''}
      </div>
      <div className="font-medium">
        Seite {pageNumber} von {totalPages}
      </div>
    </footer>
  );
}
