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
    <header className="flex items-center justify-between px-4 py-3 mb-4 border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent rounded-t-lg text-[11pt]">
      {/* Left: Logo + Studio */}
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={studioName || 'Studio Logo'}
            className="h-8 max-w-[100px] object-contain"
          />
        ) : (
          <FileText className="w-6 h-6 text-primary" />
        )}
        {studioName && (
          <span className="font-semibold text-foreground">{studioName}</span>
        )}
      </div>

      {/* Center: Title */}
      <div className="text-center">
        <h1 className="font-bold text-foreground">
          Kuechenplanungs-Protokoll
        </h1>
      </div>

      {/* Right: Meta */}
      <div className="text-right text-muted-foreground space-y-0.5">
        <div>Nr.: <span className="font-medium text-foreground">{protocolId}</span></div>
        <div>Datum: <span className="font-medium text-foreground">{createdDate}</span></div>
        <div>Kunde: <span className="font-medium text-foreground">{customerName || '-'}</span></div>
      </div>
    </header>
  );
}
