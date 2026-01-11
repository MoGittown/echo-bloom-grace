import { useRef, useCallback, useState } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

export function SummaryView({ project, onUpdateNotes }: SummaryViewProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
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

        {/* Floor Plan Elements */}
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
          <div className="kitchen-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-primary" />
              Fotos ({project.photos.length})
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {project.photos.map((photo) => (
                <div key={photo.id} className="aspect-square">
                  <img
                    src={photo.preview}
                    alt={photo.type === 'room' ? 'Raumfoto' : 'Inspiration'}
                    className="w-full h-full object-cover rounded"
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
