import { FileText } from 'lucide-react';

interface PdfPageHeaderProps {
  protocolId: string;
  createdDate: string;
  customerName?: string;
  studioName?: string;
  logoUrl?: string | null;
}

/**
 * Professional header for each PDF page with studio branding.
 */
export function PdfPageHeader({
  protocolId,
  createdDate,
  customerName,
  studioName,
  logoUrl,
}: PdfPageHeaderProps) {
  return (
    <header className="pdf-header">
      {/* Left: Logo + Studio */}
      <div className="pdf-header-logo">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={studioName || 'Studio Logo'}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
        )}
        {studioName && (
          <span className="studio-name">{studioName}</span>
        )}
      </div>

      {/* Center: Title */}
      <div className="pdf-header-title">
        <h1>Kuechen-Planungsprotokoll</h1>
        <div className="subtitle">Beratungsdokumentation</div>
      </div>

      {/* Right: Meta */}
      <div className="pdf-header-meta">
        <div>Protokoll-Nr.: <span className="value">{protocolId}</span></div>
        <div>Erstellt: <span className="value">{createdDate}</span></div>
        {customerName && (
          <div>Kunde: <span className="value">{customerName}</span></div>
        )}
      </div>
    </header>
  );
}
