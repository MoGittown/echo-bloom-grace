import { FileText } from 'lucide-react';

interface PdfPageHeaderProps {
  protocolId: string;
  createdDate: string;
  customerName: string;
  studioName?: string;
  logoUrl?: string;
}

/**
 * Compact header for each PDF page showing branding and protocol metadata.
 */
export function PdfPageHeader({
  protocolId,
  createdDate,
  customerName,
  studioName,
  logoUrl,
}: PdfPageHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 mb-3 border-b border-border/60 text-[10pt]">
      {/* Left: Logo + Studio */}
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={studioName || 'Studio Logo'}
            className="h-6 max-w-[80px] object-contain"
          />
        ) : (
          <FileText className="w-5 h-5 text-primary" />
        )}
        {studioName && (
          <span className="font-semibold text-foreground text-[11pt]">{studioName}</span>
        )}
      </div>

      {/* Center: Title */}
      <div className="text-center">
        <h1 className="font-bold text-foreground text-[11pt]">
          Kuechenplanungs-Protokoll
        </h1>
      </div>

      {/* Right: Meta */}
      <div className="text-right text-muted-foreground leading-tight">
        <div>Nr.: <span className="font-medium text-foreground">{protocolId}</span></div>
        <div>Datum: <span className="font-medium text-foreground">{createdDate}</span></div>
        <div>Kunde: <span className="font-medium text-foreground">{customerName || '-'}</span></div>
      </div>
    </header>
  );
}
