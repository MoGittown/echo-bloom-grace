type Props = {
  pageNumber: number;
  totalPages: number;
  contactLine?: string;
  studioName?: string;
};

export function PdfPageFooter({ pageNumber, totalPages, contactLine, studioName }: Props) {
  const line = contactLine?.trim() || studioName || "";
  return (
    <footer
      className="pdf-footer"
      data-pdf-footer
      data-pdf-contact-line={line}
      data-pdf-page-num={pageNumber}
      data-pdf-page-total={totalPages}
    >
      <div className="pdf-footer-inner">
        <div className="pdf-footer-left">
          <span className="pdf-footer-contact">{line}</span>
        </div>
        <div className="pdf-footer-right">
          Seite {pageNumber} von {totalPages}
        </div>
      </div>
    </footer>
  );
}
