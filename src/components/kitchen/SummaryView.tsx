import { useRef, useCallback, useState, useEffect } from 'react';
import { KitchenProject, TIMELINE_OPTIONS } from '@/types/kitchen';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Printer,
  Download,
  FileText,
  User,
  Ruler,
  Palette,
  Camera,
  ChefHat,
  StickyNote,
  CheckCircle,
  Droplets,
  Plug,
  Lightbulb,
  Trash2,
  LayoutGrid,
  Square,
  Mail,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { RoomDimensions, WallElement } from '@/types/kitchen';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SummaryViewProps {
  project: KitchenProject;
  onUpdateNotes: (notes: string) => void;
}

const ELEMENT_TYPE_LABELS: Record<string, string> = {
  window: 'Fenster',
  door: 'Tür',
  socket: 'Steckdose',
  water: 'Wasseranschluss',
  gas: 'Gasanschluss',
  drain: 'Abfluss',
  vent: 'Lüftung',
};

const WALL_LABELS: Record<string, string> = {
  north: 'Norden',
  east: 'Osten',
  south: 'Süden',
  west: 'Westen',
};

const ELEMENT_COLORS: Record<string, string> = {
  window: 'hsl(200, 80%, 55%)',
  door: 'hsl(30, 60%, 45%)',
  socket: 'hsl(45, 90%, 50%)',
  water: 'hsl(200, 90%, 50%)',
  gas: 'hsl(15, 90%, 50%)',
  drain: 'hsl(210, 50%, 40%)',
  vent: 'hsl(180, 40%, 50%)',
};

// Helper to filter and clean tagged items
const getTaggedItems = (items: string[] | undefined, prefix: string): string[] => {
  if (!items) return [];
  return items
    .filter(i => i.startsWith(prefix))
    .map(i => i.replace(prefix, ''));
};

const getUntaggedItems = (items: string[] | undefined): string[] => {
  if (!items) return [];
  return items.filter(i => !i.includes(':'));
};

// Floor Plan Canvas Component for Summary - larger for print
function FloorPlanCanvas({ room, elements }: { room: RoomDimensions; elements: WallElement[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Larger scale for better print quality
  const scale = 0.6;
  const padding = 70;
  const canvasWidth = room.length * scale + padding * 2;
  const canvasHeight = room.width * scale + padding * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e0d8';
    ctx.lineWidth = 0.5;
    const gridSize = 50 * scale;
    for (let x = padding; x <= canvasWidth - padding; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvasHeight - padding);
      ctx.stroke();
    }
    for (let y = padding; y <= canvasHeight - padding; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();
    }

    // Draw room
    ctx.strokeStyle = '#2d2a26';
    ctx.lineWidth = 5;
    ctx.strokeRect(padding, padding, room.length * scale, room.width * scale);

    // Dimensions with better visibility
    ctx.font = 'bold 14px Inter';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(`${room.length} cm`, padding + (room.length * scale) / 2, padding - 15);
    ctx.save();
    ctx.translate(padding - 20, padding + (room.width * scale) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${room.width} cm`, 0, 0);
    ctx.restore();

    // Draw elements with labels
    elements.forEach((element) => {
      const color = ELEMENT_COLORS[element.type] || '#999';
      let x = padding, y = padding, w = 0, h = 0;
      
      switch (element.wall) {
        case 'north':
          x = padding + (element.distanceFromLeft || 0) * scale;
          y = padding;
          w = element.width * scale;
          h = 12;
          break;
        case 'south':
          x = padding + (element.distanceFromLeft || 0) * scale;
          y = padding + room.width * scale - 12;
          w = element.width * scale;
          h = 12;
          break;
        case 'east':
          x = padding + room.length * scale - 12;
          y = padding + (element.distanceFromLeft || 0) * scale;
          w = 12;
          h = element.width * scale;
          break;
        case 'west':
          x = padding;
          y = padding + (element.distanceFromLeft || 0) * scale;
          w = 12;
          h = element.width * scale;
          break;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    });

    // Legend
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    let legendY = canvasHeight - 20;
    const legendItems = [...new Set(elements.map(e => e.type))];
    let legendX = padding;
    legendItems.forEach((type) => {
      ctx.fillStyle = ELEMENT_COLORS[type] || '#999';
      ctx.fillRect(legendX, legendY - 8, 12, 12);
      ctx.fillStyle = '#333';
      ctx.fillText(ELEMENT_TYPE_LABELS[type] || type, legendX + 16, legendY);
      legendX += 90;
    });
  }, [room, elements, scale, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="max-w-full border rounded bg-white"
    />
  );
}

// Wall View Canvas Component for Summary - larger for print
function WallViewCanvas({ room, elements, wall }: { room: RoomDimensions; elements: WallElement[]; wall: 'north' | 'east' | 'south' | 'west' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Larger scale for better print quality
  const scale = 0.5;
  const padding = 80;
  const wallWidth = wall === 'north' || wall === 'south' ? room.length : room.width;
  const wallHeight = room.height;
  const canvasWidth = wallWidth * scale + padding * 2;
  const canvasHeight = wallHeight * scale + padding * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wall background
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(padding, padding, wallWidth * scale, wallHeight * scale);

    // Grid
    ctx.strokeStyle = '#e5e0d8';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    const gridSize = 50 * scale;
    for (let x = padding; x <= canvasWidth - padding; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + wallHeight * scale);
      ctx.stroke();
    }
    for (let y = padding; y <= padding + wallHeight * scale; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Wall border
    ctx.strokeStyle = '#2d2a26';
    ctx.lineWidth = 4;
    ctx.strokeRect(padding, padding, wallWidth * scale, wallHeight * scale);

    // Floor line
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(padding - 15, padding + wallHeight * scale);
    ctx.lineTo(canvasWidth - padding + 15, padding + wallHeight * scale);
    ctx.stroke();

    // Ceiling line
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(padding - 10, padding);
    ctx.lineTo(canvasWidth - padding + 10, padding);
    ctx.stroke();

    // Dimensions with better visibility
    ctx.font = 'bold 14px Inter';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(`${wallWidth} cm`, canvasWidth / 2, padding - 12);
    ctx.save();
    ctx.translate(padding - 18, padding + (wallHeight * scale) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${wallHeight} cm`, 0, 0);
    ctx.restore();

    // Draw elements with dimensions
    elements.forEach((element) => {
      const color = ELEMENT_COLORS[element.type] || '#999';
      const elemX = padding + (element.distanceFromLeft || 0) * scale;
      const elemY = padding + wallHeight * scale - (element.distanceFromFloor || 0) * scale - element.height * scale;
      const elemWidth = element.width * scale;
      const elemHeight = element.height * scale;

      // Element fill
      ctx.fillStyle = color;
      ctx.fillRect(elemX, elemY, elemWidth, elemHeight);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(elemX, elemY, elemWidth, elemHeight);

      // Element label and dimensions
      ctx.font = 'bold 11px Inter';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText(ELEMENT_TYPE_LABELS[element.type] || element.type, elemX + elemWidth / 2, elemY + elemHeight / 2);
      ctx.font = '10px Inter';
      ctx.fillText(`${element.width}×${element.height}`, elemX + elemWidth / 2, elemY + elemHeight / 2 + 14);

      // Distance from left
      if (element.distanceFromLeft && element.distanceFromLeft > 0) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding, padding + wallHeight * scale + 20);
        ctx.lineTo(elemX, padding + wallHeight * scale + 20);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '10px Inter';
        ctx.fillStyle = '#666';
        ctx.fillText(`${element.distanceFromLeft} cm`, (padding + elemX) / 2, padding + wallHeight * scale + 35);
      }

      // Distance from floor
      if (element.distanceFromFloor && element.distanceFromFloor > 0) {
        const floorY = padding + wallHeight * scale;
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(elemX + elemWidth + 12, floorY);
        ctx.lineTo(elemX + elemWidth + 12, elemY + elemHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.save();
        ctx.translate(elemX + elemWidth + 25, (floorY + elemY + elemHeight) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = '10px Inter';
        ctx.fillStyle = '#666';
        ctx.fillText(`${element.distanceFromFloor} cm`, 0, 0);
        ctx.restore();
      }
    });
  }, [room, elements, wall, scale, wallWidth, wallHeight, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="max-w-full border rounded bg-white"
    />
  );
}

export function SummaryView({ project, onUpdateNotes }: SummaryViewProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const floorPlanCanvasRef = useRef<HTMLCanvasElement>(null);
  const wallViewCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { branding } = useBranding();

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!summaryRef.current) return;

    setIsGenerating(true);

    try {
      const root = summaryRef.current;
      const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-pdf-page]'));

      // Fallback (shouldn't happen): export the whole summary as a long image
      const exportTargets = pages.length > 0 ? pages : [root as unknown as HTMLElement];

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < exportTargets.length; i++) {
        const target = exportTargets[i];

        const canvas = await html2canvas(target, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (doc) => {
            // Apply tighter spacing in the cloned DOM (used for PDF rendering only)
            doc.body.classList.add('pdf-export');
            doc.body.style.background = '#ffffff';
            doc.body.style.margin = '0';
            // Approx. A4 width at 96 DPI, improves consistency across screens
            doc.body.style.width = '794px';
          },
        });

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) pdf.addPage();

        // Fit image into A4 while preserving aspect ratio
        let renderW = pageW;
        let renderH = (canvas.height * renderW) / canvas.width;
        if (renderH > pageH) {
          renderH = pageH;
          renderW = (canvas.width * renderH) / canvas.height;
        }
        const x = (pageW - renderW) / 2;
        pdf.addImage(imgData, 'PNG', x, 0, renderW, renderH);
      }

      const fileName = `Kuechen-Beratung_${project.customer.lastName || 'Kunde'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [project]);

  const generateSummaryHtml = useCallback(() => {
    const customerName = `${project.customer.firstName} ${project.customer.lastName}`.trim() || 'Unbekannt';
    const timeline = TIMELINE_OPTIONS.find(t => t.value === project.customer.timeline)?.label || project.customer.timeline || 'Nicht angegeben';
    
    let html = `
      <div class="section">
        <div class="section-title">👤 Kundendaten</div>
        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${customerName}</span></div>
        <div class="info-row"><span class="info-label">E-Mail:</span><span class="info-value">${project.customer.email || '-'}</span></div>
        <div class="info-row"><span class="info-label">Telefon:</span><span class="info-value">${project.customer.phone || '-'}</span></div>
        <div class="info-row"><span class="info-label">Adresse:</span><span class="info-value">${project.customer.address || '-'}, ${project.customer.postalCode || ''} ${project.customer.city || ''}</span></div>
        <div class="info-row"><span class="info-label">Zeitrahmen:</span><span class="info-value">${timeline}</span></div>
      </div>
      
      <div class="section">
        <div class="section-title">📐 Raummaße</div>
        <div class="info-row"><span class="info-label">Länge:</span><span class="info-value">${project.room.length} cm</span></div>
        <div class="info-row"><span class="info-label">Breite:</span><span class="info-value">${project.room.width} cm</span></div>
        <div class="info-row"><span class="info-label">Höhe:</span><span class="info-value">${project.room.height} cm</span></div>
      </div>
    `;

    if (project.preferences.style.length > 0) {
      html += `
        <div class="section">
          <div class="section-title">🎨 Stil & Design</div>
          <div>${project.preferences.style.map(s => `<span class="tag">${s}</span>`).join(' ')}</div>
        </div>
      `;
    }

    if (project.preferences.colors.length > 0 || project.preferences.materials.length > 0) {
      html += `
        <div class="section">
          <div class="section-title">🎨 Farben & Materialien</div>
          ${project.preferences.colors.length > 0 ? `<div><strong>Farben:</strong> ${project.preferences.colors.map(c => `<span class="tag">${c}</span>`).join(' ')}</div>` : ''}
          ${project.preferences.materials.length > 0 ? `<div style="margin-top: 8px;"><strong>Materialien:</strong> ${project.preferences.materials.map(m => `<span class="tag">${m}</span>`).join(' ')}</div>` : ''}
        </div>
      `;
    }

    if (project.preferences.appliances.cooktop || project.preferences.appliances.oven || project.preferences.appliances.hood) {
      html += `
        <div class="section">
          <div class="section-title">🍳 Geräte</div>
          ${project.preferences.appliances.cooktop ? `<div class="info-row"><span class="info-label">Kochfeld:</span><span class="info-value">${project.preferences.appliances.cooktop}</span></div>` : ''}
          ${project.preferences.appliances.oven ? `<div class="info-row"><span class="info-label">Backofen:</span><span class="info-value">${project.preferences.appliances.oven}</span></div>` : ''}
          ${project.preferences.appliances.hood ? `<div class="info-row"><span class="info-label">Dunstabzug:</span><span class="info-value">${project.preferences.appliances.hood}</span></div>` : ''}
          ${project.preferences.appliances.fridge ? `<div class="info-row"><span class="info-label">Kühlschrank:</span><span class="info-value">${project.preferences.appliances.fridge}</span></div>` : ''}
        </div>
      `;
    }

    if (project.preferences.budget.min > 0 || project.preferences.budget.max > 0) {
      html += `
        <div class="section">
          <div class="section-title">💰 Budget</div>
          <div class="info-row"><span class="info-label">Budget:</span><span class="info-value">${project.preferences.budget.min.toLocaleString('de-DE')} € - ${project.preferences.budget.max.toLocaleString('de-DE')} €</span></div>
        </div>
      `;
    }

    if (project.additionalNotes) {
      html += `
        <div class="section">
          <div class="section-title">📝 Notizen</div>
          <p>${project.additionalNotes}</p>
        </div>
      `;
    }

    return html;
  }, [project]);

  const handleSendEmail = useCallback(async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    setIsSendingEmail(true);
    try {
      const customerName = `${project.customer.firstName} ${project.customer.lastName}`.trim() || 'Unbekannt';
      const projectDate = formatDate(project.createdAt);
      const summaryHtml = generateSummaryHtml();

      const { data, error } = await supabase.functions.invoke('send-protocol-email', {
        body: {
          recipientEmail,
          customerName,
          projectDate,
          summaryHtml,
        },
      });

      if (error) throw error;

      toast.success('E-Mail wurde erfolgreich versendet!');
      setEmailDialogOpen(false);
      setRecipientEmail('');
    } catch (error: any) {
      console.error('Email sending failed:', error);
      toast.error(`E-Mail konnte nicht gesendet werden: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsSendingEmail(false);
    }
  }, [recipientEmail, project, generateSummaryHtml]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Extract style details from mustHaves
  const frontSurfaces = getTaggedItems(project.preferences.mustHaves, 'Oberfläche:');
  const countertopThickness = getTaggedItems(project.preferences.mustHaves, 'APStärke:');
  const backsplash = getTaggedItems(project.preferences.mustHaves, 'Nische:');
  const freeformMustHaves = getUntaggedItems(project.preferences.mustHaves);

  // Extract appliance details from appliances.other
  const applianceOther = project.preferences.appliances.other || [];
  const cooktopSize = applianceOther.find(i => ['KF-60cm', 'KF-80cm', 'KF-90cm'].includes(i))?.replace('KF-', '');
  const hoodVentilation = applianceOther.find(i => ['Abluft', 'Umluft', 'Beides möglich'].includes(i));
  const ovenHeight = applianceOther.includes('Backofen-Hocheinbau') ? 'Hocheinbau' : applianceOther.includes('Backofen-Normal') ? 'Unter Arbeitsplatte' : null;
  const dishwasherHeight = applianceOther.includes('GS-Hocheinbau') ? 'Hocheinbau' : applianceOther.includes('GS-Normal') ? 'Normal (unter AP)' : null;
  const dishwasherWidth = applianceOther.includes('GS-45cm') ? '45 cm' : applianceOther.includes('GS-60cm') ? '60 cm' : null;
  const dishwasherIntegration = applianceOther.includes('GS-Vollintegriert') ? 'Vollintegriert' : applianceOther.includes('GS-Teilintegriert') ? 'Teilintegriert' : null;
  const applianceNotes = applianceOther.filter(i => i.startsWith('Notiz:')).map(i => i.replace('Notiz:', ''));
  const applianceBrands = applianceOther.filter(i => i.startsWith('Marke:')).map(i => i.replace('Marke:', ''));
  
  // Group extras by appliance type
  const cooktopExtras = applianceOther.filter(i => ['Flex-Zone', 'Teppan Yaki', 'Wok-Mulde'].includes(i));
  const ovenExtras = applianceOther.filter(i => ['Pyrolyse', 'Dampfgarer', 'Kombi-Dampfgarer', 'Zweiter Backofen', 'Wärmeschublade', 'Vakuumierschublade', 'Kaffeevollautomat'].includes(i));
  const fridgeExtras = applianceOther.filter(i => ['Gefrierschrank separat', 'Weinkühlschrank'].includes(i));
  const dishwasherExtras = applianceOther.filter(i => ['Zweiter Geschirrspüler'].includes(i));

  // Extract sink/faucet/lighting details
  const lighting = project.preferences.lighting || [];
  const sinkColor = getTaggedItems(lighting, 'Spülenfarbe:');
  const sinkInstall = getTaggedItems(lighting, 'Einbau:');
  const sinkSize = getTaggedItems(lighting, 'Becken:');
  const sinkBrands = getTaggedItems(lighting, 'Hersteller:');
  const faucetType = getTaggedItems(lighting, 'Armatur:').filter(t => !t.startsWith('Ausziehbar') && !t.startsWith('Schwenkbar'));
  const faucetFinish = getTaggedItems(lighting, 'ArmaturFarbe:');
  const faucetExtras = getTaggedItems(lighting, 'ArmaturExtra:');
  const wasteSystem = getTaggedItems(lighting, 'Müll:');
  const lightingOptions = getTaggedItems(lighting, 'Licht:');
  const hasRestebecken = lighting.includes('Restebecken');
  const hasAusziehbar = lighting.includes('Armatur:Ausziehbar');
  const hasSchwenkbar = lighting.includes('Armatur:Schwenkbar');

  const TagList = ({ items, color = 'primary' }: { items: string[]; color?: string }) => (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((item) => (
        <span
          key={item}
          className={`px-2 py-1 bg-${color}/10 text-${color} rounded text-xs`}
        >
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Zusammenfassung
        </h2>
        <p className="text-muted-foreground mt-2">
          Alle Informationen auf einen Blick
        </p>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Protokoll per E-Mail senden
            </DialogTitle>
            <DialogDescription>
              Geben Sie die E-Mail-Adresse des Küchenstudios ein, um das Beratungsprotokoll zu senden.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipientEmail">E-Mail-Adresse</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="studio@kuechenstudio.de"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendEmail();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
              disabled={isSendingEmail}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !recipientEmail}
              className="gap-2"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Senden
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Content */}
      <div ref={summaryRef} className="space-y-6 bg-background p-6 rounded-xl">
        {/* ===== PAGE 1: Header, Customer, Style, Appliances ===== */}
        <div data-pdf-page="1" className="print-page-1 bg-white p-4">
          {/* Header with Branding */}
          <div className="text-center border-b pb-6">
            {branding.logoUrl ? (
              <div className="flex flex-col items-center gap-3">
                <img 
                  src={branding.logoUrl} 
                  alt="Studio Logo" 
                  className="h-16 max-w-[200px] object-contain"
                />
                {branding.studioName && (
                  <h1 className="text-xl font-display font-bold text-foreground">
                    {branding.studioName}
                  </h1>
                )}
                <p className="text-lg text-muted-foreground">Küchen-Beratungsprotokoll</p>
              </div>
            ) : branding.studioName ? (
              <div className="flex flex-col items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {branding.studioName}
                </h1>
                <p className="text-lg text-muted-foreground">Küchen-Beratungsprotokoll</p>
              </div>
            ) : (
              <h1 className="text-2xl font-display font-bold text-foreground">
                Küchen-Beratungsprotokoll
              </h1>
            )}
            <p className="text-muted-foreground mt-2">
              Erstellt am {formatDate(project.createdAt)}
            </p>
          </div>

          {/* Customer Info */}
          <div className="kitchen-card p-6 mt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              Kundendaten
            </h3>
            {project.customer.firstName || project.customer.lastName || project.customer.email ? (
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {(project.customer.firstName || project.customer.lastName) && (
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">
                      {project.customer.firstName} {project.customer.lastName}
                    </span>
                  </div>
                )}
                {project.customer.email && (
                  <div>
                    <span className="text-muted-foreground">E-Mail:</span>
                    <span className="ml-2">{project.customer.email}</span>
                  </div>
                )}
                {project.customer.phone && (
                  <div>
                    <span className="text-muted-foreground">Telefon:</span>
                    <span className="ml-2">{project.customer.phone}</span>
                  </div>
                )}
                {(project.customer.address || project.customer.city) && (
                  <div>
                    <span className="text-muted-foreground">Adresse:</span>
                    <span className="ml-2">
                      {project.customer.address}{project.customer.address && project.customer.postalCode ? ', ' : ''}
                      {project.customer.postalCode} {project.customer.city}
                    </span>
                  </div>
                )}
                {project.customer.timeline && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Gewünschter Montagezeitraum:</span>
                    {(() => {
                      const timelineOption = TIMELINE_OPTIONS.find(t => t.value === project.customer.timeline);
                      const priorityColor = timelineOption?.priority === 'high' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : timelineOption?.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-muted text-muted-foreground';
                      return (
                        <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${priorityColor}`}>
                          {timelineOption?.label || project.customer.timeline}
                          {timelineOption?.priority === 'high' && ' ⚡'}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Keine Kontaktdaten angegeben</p>
            )}
            {project.customer.notes && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-muted-foreground text-sm">Anmerkungen:</span>
                <p className="mt-1">{project.customer.notes}</p>
              </div>
            )}
          </div>

          {/* STIL & DESIGN */}
          <div className="kitchen-card p-6 mt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              Stil & Design
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              {project.preferences.style.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Küchenstil:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.preferences.style.map((s) => (
                      <span key={s} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {project.preferences.colors.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Frontenfarben:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.preferences.colors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {project.preferences.materials.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Frontmaterial:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.preferences.materials.map((m) => (
                      <span key={m} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {frontSurfaces.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Frontenoberfläche:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {frontSurfaces.map((s) => (
                      <span key={s} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {project.preferences.countertop.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Arbeitsplatte Material:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.preferences.countertop.map((c) => (
                      <span key={c} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {countertopThickness.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Arbeitsplatte Stärke:</span>
                  <span className="ml-2">{countertopThickness.join(', ')}</span>
                </div>
              )}
              {backsplash.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Nischenrückwand:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {backsplash.map((b) => (
                      <span key={b} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{b}</span>
                    ))}
                  </div>
                </div>
              )}
              {project.preferences.manufacturers.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Küchenhersteller:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.preferences.manufacturers.map((m) => (
                      <span key={m} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {project.preferences.storage.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Stauraum:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.preferences.storage.map((s) => (
                      <span key={s} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Budget:</span>
                <span className="ml-2 font-medium">
                  €{project.preferences.budget.min.toLocaleString()} - €{project.preferences.budget.max.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* ELEKTROGERÄTE */}
          <div className="kitchen-card p-6 mt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Plug className="w-5 h-5 text-primary" />
              Elektrogeräte
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {project.preferences.appliances.cooktop && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Kochfeld:</span> {project.preferences.appliances.cooktop}
                    {cooktopSize && <span className="text-muted-foreground"> ({cooktopSize})</span>}
                    {cooktopExtras.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cooktopExtras.map(e => <span key={e} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs">{e}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {project.preferences.appliances.hood && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Dunstabzug:</span> {project.preferences.appliances.hood}
                    {hoodVentilation && <span className="text-muted-foreground"> ({hoodVentilation})</span>}
                  </div>
                </div>
              )}
              {project.preferences.appliances.oven && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Backofen:</span> {project.preferences.appliances.oven}
                    {ovenHeight && <span className="text-muted-foreground"> ({ovenHeight})</span>}
                    {ovenExtras.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ovenExtras.map(e => <span key={e} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs">{e}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {project.preferences.appliances.fridge && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Kühlschrank:</span> {project.preferences.appliances.fridge}
                    {fridgeExtras.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fridgeExtras.map(e => <span key={e} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs">{e}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {project.preferences.appliances.dishwasher && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Geschirrspüler:</span>
                    <span> {dishwasherWidth || '60 cm'}</span>
                    <span>, {dishwasherHeight || 'Normal (unter AP)'}</span>
                    <span>, {dishwasherIntegration || 'Vollintegriert'}</span>
                    {dishwasherExtras.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dishwasherExtras.map(e => <span key={e} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs">{e}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {project.preferences.appliances.microwave && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span>Mikrowelle (Einbau)</span>
                </div>
              )}
            </div>
            
            {applianceBrands.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-muted-foreground text-sm">Bevorzugte Gerätemarken:</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {applianceBrands.map((brand) => (
                    <span key={brand} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">{brand}</span>
                  ))}
                </div>
              </div>
            )}
            
            {applianceNotes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-muted-foreground text-sm">Sonstige Wünsche:</span>
                <p className="mt-1 text-sm">{applianceNotes.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== PAGE 2: Sink, Waste, Lighting, Room, Floor Plan ===== */}
        <div data-pdf-page="2" className="print-page-break-before bg-white p-4">
          {/* SPÜLE & ARMATUR */}
          <div className="kitchen-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Droplets className="w-5 h-5 text-primary" />
              Spüle & Armatur
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {project.preferences.sink && (
                <div>
                  <span className="text-muted-foreground">Material:</span>
                  <span className="ml-2 font-medium">{project.preferences.sink}</span>
                </div>
              )}
              {sinkColor.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Farbe:</span>
                  <span className="ml-2">{sinkColor.join(', ')}</span>
                </div>
              )}
              {sinkInstall.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Einbauart:</span>
                  <span className="ml-2">{sinkInstall.join(', ')}</span>
                </div>
              )}
              {sinkSize.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Becken:</span>
                  <span className="ml-2">{sinkSize.join(', ')}{hasRestebecken ? ', Restebecken' : ''}</span>
                </div>
              )}
              {faucetType.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Armatur:</span>
                  <span className="ml-2">{faucetType.join(', ')}</span>
                  {(hasAusziehbar || hasSchwenkbar) && (
                    <span className="text-muted-foreground"> ({[hasAusziehbar && 'Ausziehbar', hasSchwenkbar && 'Schwenkbar'].filter(Boolean).join(', ')})</span>
                  )}
                </div>
              )}
              {faucetFinish.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Armatur-Oberfläche:</span>
                  <span className="ml-2">{faucetFinish.join(', ')}</span>
                </div>
              )}
              {sinkBrands.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Hersteller:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sinkBrands.map((b) => (
                      <span key={b} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{b}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {faucetExtras.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-muted-foreground text-sm">Zusatzfunktionen:</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {faucetExtras.map((extra) => (
                    <span key={extra} className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">{extra}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MÜLL & BELEUCHTUNG */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="kitchen-card p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Trash2 className="w-5 h-5 text-primary" />
                Müllsystem
              </h3>
              {wasteSystem.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {wasteSystem.map((w) => (
                    <span key={w} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{w}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nicht angegeben</p>
              )}
            </div>
            <div className="kitchen-card p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-primary" />
                Beleuchtung
              </h3>
              {lightingOptions.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {lightingOptions.map((l) => (
                    <span key={l} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{l}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nicht angegeben</p>
              )}
            </div>
          </div>

          {/* Room Dimensions */}
          <div className="kitchen-card p-6 mt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Ruler className="w-5 h-5 text-primary" />
              Raummaße
            </h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{project.room.length}</div>
                <div className="text-muted-foreground">Länge (cm)</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{project.room.width}</div>
                <div className="text-muted-foreground">Breite (cm)</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{project.room.height}</div>
                <div className="text-muted-foreground">Höhe (cm)</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-accent">
                  {((project.room.length * project.room.width) / 10000).toFixed(1)}
                </div>
                <div className="text-muted-foreground">Fläche (m²)</div>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-muted-foreground text-sm">Raumform:</span>
              <span className="ml-2 font-medium capitalize">
                {project.room.shape === 'rectangular' && 'Rechteckig'}
                {project.room.shape === 'l-shaped' && 'L-Form'}
                {project.room.shape === 'u-shaped' && 'U-Form'}
                {project.room.shape === 'galley' && 'Schlauch'}
              </span>
            </div>
          </div>

          {/* Floor Plan Visual */}
          <div className="kitchen-card p-6 mt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              Grundriss
            </h3>
            <div className="flex justify-center print-canvas-container">
              <FloorPlanCanvas 
                room={project.room} 
                elements={project.floorPlan.elements} 
              />
            </div>
          </div>
        </div>

        {/* ===== PAGE 3: Wall Views Nord & Ost ===== */}
        <div data-pdf-page="3" className="print-page-break-before bg-white p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2 text-lg">
            <Square className="w-5 h-5 text-primary" />
            Wandansichten (1/2)
          </h3>
          {(['north', 'east'] as const).map((wall) => {
            const wallElements = project.floorPlan.elements.filter(e => e.wall === wall);
            return (
              <div key={wall} className="kitchen-card p-4 mb-3 print-half-page">
                <h4 className="font-semibold flex items-center gap-2 mb-1 text-sm">
                  {WALL_LABELS[wall]} - Wandansicht
                </h4>
                <div className="flex justify-center print-canvas-container">
                  <WallViewCanvas 
                    room={project.room} 
                    elements={wallElements}
                    wall={wall}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== PAGE 4: Wall Views Süd & West + Element Table ===== */}
        <div data-pdf-page="4" className="print-page-break-before bg-white p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2 text-lg">
            <Square className="w-5 h-5 text-primary" />
            Wandansichten (2/2)
          </h3>
          {(['south', 'west'] as const).map((wall) => {
            const wallElements = project.floorPlan.elements.filter(e => e.wall === wall);
            return (
              <div key={wall} className="kitchen-card p-4 mb-3 print-half-page">
                <h4 className="font-semibold flex items-center gap-2 mb-1 text-sm">
                  {WALL_LABELS[wall]} - Wandansicht
                </h4>
                <div className="flex justify-center print-canvas-container">
                  <WallViewCanvas 
                    room={project.room} 
                    elements={wallElements}
                    wall={wall}
                  />
                </div>
              </div>
            );
          })}

          {/* Floor Plan Elements Table - on Page 4 */}
          {project.floorPlan.elements.length > 0 && (
            <div className="kitchen-card p-4 mt-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                Eingetragene Elemente ({project.floorPlan.elements.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Typ</th>
                      <th className="text-left py-1">Wand</th>
                      <th className="text-left py-1">Maße</th>
                      <th className="text-left py-1">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.floorPlan.elements.map((element) => (
                      <tr key={element.id} className="border-b border-border/50">
                        <td className="py-1">{ELEMENT_TYPE_LABELS[element.type] || element.type}</td>
                        <td className="py-1">{WALL_LABELS[element.wall] || element.wall}</td>
                        <td className="py-1">{element.width} × {element.height} cm</td>
                        <td className="py-1">{element.distanceFromLeft} cm v. links, {element.distanceFromFloor} cm v. Boden</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ===== PAGE 5: Must-haves, Nice-to-haves, Notes, ALL Photos ===== */}
        <div data-pdf-page="5" className="print-page-break-before bg-white p-4">
          {/* Must-haves & Nice-to-haves */}
          {(freeformMustHaves.length > 0 || project.preferences.niceToHaves.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {freeformMustHaves.length > 0 && (
                <div className="kitchen-card p-4">
                  <h3 className="font-semibold text-destructive mb-2">Must-Haves</h3>
                  <ul className="space-y-1">
                    {freeformMustHaves.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-destructive">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {project.preferences.niceToHaves.length > 0 && (
                <div className="kitchen-card p-4">
                  <h3 className="font-semibold text-yellow-600 mb-2">Nice-to-Haves</h3>
                  <ul className="space-y-1">
                    {project.preferences.niceToHaves.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-yellow-600">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Print version of notes */}
          {project.additionalNotes && (
            <div className="kitchen-card p-4 mb-4 hidden print:block">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <StickyNote className="w-5 h-5 text-primary" />
                Zusätzliche Notizen
              </h3>
              <p className="whitespace-pre-wrap text-sm">{project.additionalNotes}</p>
            </div>
          )}

          {/* ALL Photos - Split into pages of 6 for print */}
          {project.photos.length > 0 && (() => {
            const validPhotos = project.photos.filter(p => p.preview);
            const photosPerPage = 6;
            const photoPages: typeof validPhotos[] = [];
            for (let i = 0; i < validPhotos.length; i += photosPerPage) {
              photoPages.push(validPhotos.slice(i, i + photosPerPage));
            }
            
            return (
              <>
                {project.photos.some(p => !p.preview) && (
                  <div className="kitchen-card p-4 mb-4">
                    <p className="text-xs text-amber-600">
                      ⚠ Einige Fotos haben keine Bilddaten. Bitte im Schritt "Fotos" löschen und erneut hochladen.
                    </p>
                  </div>
                )}
                {photoPages.map((pagePhotos, pageIndex) => (
                  <div 
                    key={pageIndex} 
                    className={`kitchen-card p-4 ${pageIndex > 0 ? 'print:break-before-page mt-4' : ''}`}
                  >
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Camera className="w-5 h-5 text-primary" />
                      Fotos {photoPages.length > 1 ? `(Seite ${pageIndex + 1}/${photoPages.length})` : `(${validPhotos.length})`}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 print:gap-3">
                      {pagePhotos.map((photo) => (
                        <div key={photo.id} className="overflow-hidden rounded-lg border border-border print:break-inside-avoid">
                          <img
                            src={photo.preview}
                            alt={photo.type === 'room' ? 'Raumfoto' : 'Inspiration'}
                            className="w-full h-48 object-cover print:h-40"
                          />
                          <div className="p-2 bg-muted/50 print:p-1">
                            <p className="text-xs text-muted-foreground">
                              {photo.type === 'room' ? 'Raumfoto' : 'Inspiration'}
                              {photo.description && `: ${photo.description}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            );
          })()}

        </div>

        {/* Additional Notes - Interactive (no-print) */}
        <div className="kitchen-card p-6 no-print">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <StickyNote className="w-5 h-5 text-primary" />
            Zusätzliche Notizen
          </h3>
          <Textarea
            value={project.additionalNotes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="Weitere Anmerkungen, Besonderheiten, nächste Schritte..."
            className="kitchen-input min-h-[120px]"
          />
        </div>

        {/* Contact Footer - displayed at the very end after notes */}
        {(branding.contact.address || branding.contact.phone || branding.contact.email || branding.contact.website) && (
          <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {branding.contact.address && <span>{branding.contact.address}</span>}
              {branding.contact.phone && <span>Tel: {branding.contact.phone}</span>}
              {branding.contact.email && <span>{branding.contact.email}</span>}
              {branding.contact.website && <span>{branding.contact.website}</span>}
            </div>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center no-print pt-4">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Drucken
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="gap-2"
            disabled={isGenerating}
          >
            <Download className="w-4 h-4" />
            {isGenerating ? 'Wird erstellt...' : 'Als PDF speichern'}
          </Button>
          <Button
            onClick={() => setEmailDialogOpen(true)}
            variant="secondary"
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            Per E-Mail senden
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
