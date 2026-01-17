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
    <footer className="flex items-center justify-between px-4 py-2 mt-4 border-t border-border bg-muted/30 rounded-b-lg text-[10px] text-muted-foreground">
      <div className="truncate max-w-[70%]">
        {contactLine || studioName || ''}
      </div>
      <div className="font-medium">
        Seite {pageNumber} von {totalPages}
      </div>
    </footer>
  );
}
