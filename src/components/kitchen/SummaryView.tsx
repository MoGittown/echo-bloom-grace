import { useRef, useCallback, useState, useEffect } from 'react';
import { KitchenProject } from '@/types/kitchen';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { RoomDimensions, WallElement } from '@/types/kitchen';

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
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!summaryRef.current) return;

    setIsGenerating(true);

    try {
      const element = summaryRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Kuechen-Beratung_${project.customer.lastName || 'Kunde'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [project]);

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
  const cookingZones = applianceOther.find(i => ['4-Zonen', '5-Zonen', '6-Zonen'].includes(i));
  const hoodVentilation = applianceOther.find(i => ['Abluft', 'Umluft', 'Beides möglich'].includes(i));
  const ovenHeight = applianceOther.includes('Backofen-Hocheinbau') ? 'Hocheinbau' : applianceOther.includes('Backofen-Normal') ? 'Unter Arbeitsplatte' : null;
  const dishwasherHeight = applianceOther.includes('GS-Hocheinbau') ? 'Hocheinbau' : applianceOther.includes('GS-Normal') ? 'Normal' : null;
  const dishwasherWidth = applianceOther.includes('GS-45cm') ? '45 cm' : applianceOther.includes('GS-60cm') ? '60 cm' : null;
  const dishwasherIntegration = applianceOther.includes('GS-Vollintegriert') ? 'Vollintegriert' : applianceOther.includes('GS-Teilintegriert') ? 'Teilintegriert' : null;
  const applianceBrands = applianceOther.filter(i => i.startsWith('Marke:')).map(i => i.replace('Marke:', ''));
  const applianceExtras = applianceOther.filter(i => 
    ['Flex-Zone', 'Teppan Yaki', 'Wok-Mulde', 'Pyrolyse', 'Dampfgarer', 'Kombi-Dampfgarer', 
     'Zweiter Backofen', 'Wärmeschublade', 'Vakuumierschublade', 'Kaffeevollautomat',
     'Gefrierschrank separat', 'Weinkühlschrank', 'Zweiter Geschirrspüler'].includes(i)
  );

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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center no-print">
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
      </div>

      {/* Summary Content */}
      <div ref={summaryRef} className="space-y-6 bg-background p-6 rounded-xl">
        {/* Header */}
        <div className="text-center border-b pb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Küchen-Beratungsprotokoll
          </h1>
          <p className="text-muted-foreground mt-2">
            Erstellt am {formatDate(project.createdAt)}
          </p>
        </div>

        {/* Customer Info */}
        <div className="kitchen-card p-6">
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
        <div className="kitchen-card p-6">
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
            <div>
              <span className="text-muted-foreground">Budget:</span>
              <span className="ml-2 font-medium">
                €{project.preferences.budget.min.toLocaleString()} - €{project.preferences.budget.max.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ELEKTROGERÄTE */}
        <div className="kitchen-card p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Plug className="w-5 h-5 text-primary" />
            Elektrogeräte
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {project.preferences.appliances.cooktop && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <span className="font-medium">Kochfeld:</span> {project.preferences.appliances.cooktop}
                  {cookingZones && <span className="text-muted-foreground"> ({cookingZones})</span>}
                </div>
              </div>
            )}
            {project.preferences.appliances.hood && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <span className="font-medium">Dunstabzug:</span> {project.preferences.appliances.hood}
                  {hoodVentilation && <span className="text-muted-foreground"> ({hoodVentilation})</span>}
                </div>
              </div>
            )}
            {project.preferences.appliances.oven && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <span className="font-medium">Backofen:</span> {project.preferences.appliances.oven}
                  {ovenHeight && <span className="text-muted-foreground"> ({ovenHeight})</span>}
                </div>
              </div>
            )}
            {project.preferences.appliances.fridge && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <span className="font-medium">Kühlschrank:</span> {project.preferences.appliances.fridge}
                </div>
              </div>
            )}
            {project.preferences.appliances.dishwasher && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <span className="font-medium">Geschirrspüler:</span>
                  {dishwasherWidth && <span> {dishwasherWidth}</span>}
                  {dishwasherHeight && <span>, {dishwasherHeight}</span>}
                  {dishwasherIntegration && <span>, {dishwasherIntegration}</span>}
                </div>
              </div>
            )}
            {project.preferences.appliances.microwave && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>Mikrowelle</span>
              </div>
            )}
          </div>
          
          {applianceExtras.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-muted-foreground text-sm">Zusatzausstattung:</span>
              <div className="flex flex-wrap gap-1 mt-2">
                {applianceExtras.map((extra) => (
                  <span key={extra} className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">{extra}</span>
                ))}
              </div>
            </div>
          )}
          
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
        </div>

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
        {(wasteSystem.length > 0 || lightingOptions.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {wasteSystem.length > 0 && (
              <div className="kitchen-card p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Trash2 className="w-5 h-5 text-primary" />
                  Müllsystem
                </h3>
                <div className="flex flex-wrap gap-1">
                  {wasteSystem.map((w) => (
                    <span key={w} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{w}</span>
                  ))}
                </div>
              </div>
            )}
            {lightingOptions.length > 0 && (
              <div className="kitchen-card p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Beleuchtung
                </h3>
                <div className="flex flex-wrap gap-1">
                  {lightingOptions.map((l) => (
                    <span key={l} className="px-2 py-1 bg-muted text-foreground rounded text-xs">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Room Dimensions */}
        <div className="kitchen-card p-6">
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
        <div className="kitchen-card p-6 print-page-break-before">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Grundriss
          </h3>
          <div className="flex justify-center">
            <FloorPlanCanvas 
              room={project.room} 
              elements={project.floorPlan.elements} 
            />
          </div>
        </div>

        {/* Wall Views */}
        {['north', 'east', 'south', 'west'].map((wall, index) => {
          const wallElements = project.floorPlan.elements.filter(e => e.wall === wall);
          if (wallElements.length === 0) return null;
          return (
            <div key={wall} className={`kitchen-card p-6 ${index % 2 === 0 ? 'print-page-break-before' : ''}`}>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Square className="w-5 h-5 text-primary" />
                {WALL_LABELS[wall]} - Wandansicht
              </h3>
              <div className="flex justify-center">
                <WallViewCanvas 
                  room={project.room} 
                  elements={wallElements}
                  wall={wall as 'north' | 'east' | 'south' | 'west'}
                />
              </div>
            </div>
          );
        })}

        {/* Floor Plan Elements Table */}
        {project.floorPlan.elements.length > 0 && (
          <div className="kitchen-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              Eingetragene Elemente ({project.floorPlan.elements.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Typ</th>
                    <th className="text-left py-2">Wand</th>
                    <th className="text-left py-2">Maße</th>
                    <th className="text-left py-2">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {project.floorPlan.elements.map((element) => (
                    <tr key={element.id} className="border-b border-border/50">
                      <td className="py-2">{ELEMENT_TYPE_LABELS[element.type] || element.type}</td>
                      <td className="py-2">{WALL_LABELS[element.wall] || element.wall}</td>
                      <td className="py-2">{element.width} × {element.height} cm</td>
                      <td className="py-2">{element.distanceFromLeft} cm v. links, {element.distanceFromFloor} cm v. Boden</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Must-haves & Nice-to-haves */}
        {(freeformMustHaves.length > 0 || project.preferences.niceToHaves.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {freeformMustHaves.length > 0 && (
              <div className="kitchen-card p-6">
                <h3 className="font-semibold text-destructive mb-3">Must-Haves</h3>
                <ul className="space-y-2">
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
              <div className="kitchen-card p-6">
                <h3 className="font-semibold text-yellow-600 mb-3">Nice-to-Haves</h3>
                <ul className="space-y-2">
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

        {/* Photos */}
        {project.photos.length > 0 && (
          <div className="kitchen-card p-6 print-page-break-before">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-primary" />
              Fotos ({project.photos.length})
            </h3>
            <div className="grid grid-cols-2 gap-4 print-photos-grid">
              {project.photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-lg">
                  <img
                    src={photo.preview}
                    alt={photo.type === 'room' ? 'Raumfoto' : 'Inspiration'}
                    className="w-full h-auto object-cover rounded-lg"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Notes */}
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

        {/* Print version of notes */}
        {project.additionalNotes && (
          <div className="kitchen-card p-6 hidden print:block">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <StickyNote className="w-5 h-5 text-primary" />
              Zusätzliche Notizen
            </h3>
            <p className="whitespace-pre-wrap">{project.additionalNotes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
