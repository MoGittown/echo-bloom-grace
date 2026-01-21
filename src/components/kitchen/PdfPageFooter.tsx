type Props = {
  pageNumber: number;
  totalPages: number;
  contactLine?: string;
  studioName?: string;
};

export function PdfPageFooter({ pageNumber, totalPages, contactLine, studioName }: Props) {
  return (
    <footer className="pdf-footer">
      <div className="pdf-footer-inner">
        <div className="pdf-footer-left">
          <span className="pdf-footer-contact">
            {contactLine || studioName || ""}
          </span>
        </div>
        <div className="pdf-footer-right">
          Seite {pageNumber} von {totalPages}
        </div>
      </div>
    </footer>
  );
}
