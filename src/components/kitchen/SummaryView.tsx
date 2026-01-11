import { useRef, useCallback, useState } from 'react';
import { KitchenProject, ELEMENT_TYPES } from '@/types/kitchen';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <span className="ml-2 font-medium">
                {project.customer.firstName} {project.customer.lastName}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">E-Mail:</span>
              <span className="ml-2">{project.customer.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Telefon:</span>
              <span className="ml-2">{project.customer.phone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Adresse:</span>
              <span className="ml-2">
                {project.customer.address}, {project.customer.postalCode}{' '}
                {project.customer.city}
              </span>
            </div>
          </div>
          {project.customer.notes && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-muted-foreground text-sm">Anmerkungen:</span>
              <p className="mt-1">{project.customer.notes}</p>
            </div>
          )}
        </div>

        {/* Room Dimensions */}
        <div className="kitchen-card p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Ruler className="w-5 h-5 text-primary" />
            Raummaße
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {project.room.length}
              </div>
              <div className="text-muted-foreground">Länge (cm)</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {project.room.width}
              </div>
              <div className="text-muted-foreground">Breite (cm)</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {project.room.height}
              </div>
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
                      <td className="py-2">
                        {ELEMENT_TYPE_LABELS[element.type] || element.type}
                      </td>
                      <td className="py-2">
                        {WALL_LABELS[element.wall] || element.wall}
                      </td>
                      <td className="py-2">
                        {element.width} × {element.height} cm
                      </td>
                      <td className="py-2">
                        {element.distanceFromLeft} cm v. links,{' '}
                        {element.distanceFromFloor} cm v. Boden
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Preferences */}
        <div className="kitchen-card p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            Wünsche & Vorlieben
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            {project.preferences.style.length > 0 && (
              <div>
                <span className="text-muted-foreground">Stil:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.preferences.style.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {project.preferences.colors.length > 0 && (
              <div>
                <span className="text-muted-foreground">Farben:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.preferences.colors.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-1 bg-accent/10 text-accent rounded text-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {project.preferences.materials.length > 0 && (
              <div>
                <span className="text-muted-foreground">Materialien:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.preferences.materials.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-1 bg-muted text-foreground rounded text-xs"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {project.preferences.countertop.length > 0 && (
              <div>
                <span className="text-muted-foreground">Arbeitsplatte:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.preferences.countertop.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-1 bg-muted text-foreground rounded text-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {project.preferences.manufacturers.length > 0 && (
              <div>
                <span className="text-muted-foreground">Hersteller:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.preferences.manufacturers.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-1 bg-muted text-foreground rounded text-xs"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Budget:</span>
              <span className="ml-2 font-medium">
                €{project.preferences.budget.min.toLocaleString()} -{' '}
                €{project.preferences.budget.max.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Appliances */}
        <div className="kitchen-card p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-primary" />
            Elektrogeräte
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {project.preferences.appliances.cooktop && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>Kochfeld: {project.preferences.appliances.cooktop}</span>
              </div>
            )}
            {project.preferences.appliances.oven && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>Backofen: {project.preferences.appliances.oven}</span>
              </div>
            )}
            {project.preferences.appliances.fridge && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>Kühlschrank: {project.preferences.appliances.fridge}</span>
              </div>
            )}
            {project.preferences.appliances.hood && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>Dunstabzug: {project.preferences.appliances.hood}</span>
              </div>
            )}
            {project.preferences.appliances.dishwasher && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>Geschirrspüler</span>
              </div>
            )}
            {project.preferences.appliances.microwave && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span>Mikrowelle</span>
              </div>
            )}
          </div>
        </div>

        {/* Must-haves & Nice-to-haves */}
        {(project.preferences.mustHaves.length > 0 ||
          project.preferences.niceToHaves.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {project.preferences.mustHaves.length > 0 && (
              <div className="kitchen-card p-6">
                <h3 className="font-semibold text-destructive mb-3">Must-Haves</h3>
                <ul className="space-y-2">
                  {project.preferences.mustHaves.map((item, i) => (
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

        {project.additionalNotes && (
          <div className="kitchen-card p-6 print-only hidden">
            <h3 className="font-semibold mb-3">Zusätzliche Notizen</h3>
            <p className="whitespace-pre-wrap">{project.additionalNotes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-6 border-t">
          <p>
            Zuletzt aktualisiert: {formatDate(project.updatedAt)}
          </p>
          <p className="mt-1">Projekt-ID: {project.id}</p>
        </div>
      </div>
    </motion.div>
  );
}