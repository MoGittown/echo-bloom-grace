import { useRef, useCallback, useState, useEffect } from 'react';
import { KitchenProject, TIMELINE_OPTIONS, CustomerData } from '@/types/kitchen';
import { escapeHtml } from '@/lib/htmlSanitizer';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  FileSpreadsheet,
  CalendarClock,
  Briefcase,
  MapPin,
  Phone,
  Globe,
  Zap,
  Wallet,
  Send,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { RoomDimensions, WallElement } from '@/types/kitchen';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppointmentRequest } from './AppointmentRequest';
import { PdfDebugConsole, type PdfDebugEvent, type PdfDebugLevel } from './PdfDebugConsole';
import { PdfPageHeader } from './PdfPageHeader';
import { PdfPageFooter } from './PdfPageFooter';
import { useParams } from 'react-router-dom';


interface SummaryViewProps {
  project: KitchenProject;
  onUpdateNotes: (notes: string) => void;
  onUpdateCustomer?: (data: Partial<import('@/types/kitchen').CustomerData>) => void;
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
  window: 'hsl(140, 55%, 42%)',
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
function FloorPlanCanvas({
  room,
  elements,
  dataCanvasKey,
}: {
  room: RoomDimensions;
  elements: WallElement[];
  dataCanvasKey: string;
}) {
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
      data-pdf-canvas={dataCanvasKey}
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="max-w-full border rounded bg-white"
    />
  );
}

// Wall View Canvas Component for Summary - larger for print
function WallViewCanvas({
  room,
  elements,
  wall,
  dataCanvasKey,
}: {
  room: RoomDimensions;
  elements: WallElement[];
  wall: 'north' | 'east' | 'south' | 'west';
  dataCanvasKey: string;
}) {
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
      data-pdf-canvas={dataCanvasKey}
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="max-w-full border rounded bg-white"
    />
  );
}

export function SummaryView({ project, onUpdateNotes, onUpdateCustomer }: SummaryViewProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const floorPlanCanvasRef = useRef<HTMLCanvasElement>(null);
  const wallViewCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [sendFormErrors, setSendFormErrors] = useState<Record<string, string>>({});

  const [pdfDebugOpen, setPdfDebugOpen] = useState(false);
  const [pdfDebugEvents, setPdfDebugEvents] = useState<PdfDebugEvent[]>([]);

  const clearPdfDebug = useCallback(() => setPdfDebugEvents([]), []);

  const addPdfDebugEvent = useCallback(
    (level: PdfDebugLevel, message: string, details?: string) => {
      setPdfDebugEvents((prev) => [...prev, { ts: Date.now(), level, message, details }]);
    },
    [],
  );

  const formatUnknownError = useCallback((err: unknown): string => {
    if (err instanceof Error) return `${err.name}: ${err.message}\n${err.stack ?? ''}`.trim();

    // DOMException and other error-like objects often stringify to "{}" because fields are non-enumerable.
    if (err && typeof err === 'object') {
      const anyErr = err as { name?: unknown; message?: unknown; stack?: unknown };
      const name = typeof anyErr.name === 'string' ? anyErr.name : undefined;
      const message = typeof anyErr.message === 'string' ? anyErr.message : undefined;
      const stack = typeof anyErr.stack === 'string' ? anyErr.stack : undefined;

      if (name || message || stack) {
        return `${name ?? 'Error'}: ${message ?? ''}\n${stack ?? ''}`.trim();
      }
    }

    return String(err);
  }, []);

  const { slug: studioSlug } = useParams<{ slug?: string }>();
  const { branding } = useBranding(studioSlug);

  // PDF metadata for professional header/footer
  const validPhotos = project.photos.filter(p => p.preview);
  const photosPerPage = 6;
  const photoPages: typeof validPhotos[] = [];
  for (let i = 0; i < validPhotos.length; i += photosPerPage) {
    photoPages.push(validPhotos.slice(i, i + photosPerPage));
  }
  const createdIso = project.createdAt instanceof Date ? project.createdAt.toISOString() : String(project.createdAt);
  const protocolId = `KP-${createdIso.slice(2, 10).replace(/-/g, '')}`;
  const customerFullName = [project.customer.firstName, project.customer.lastName].filter(Boolean).join(' ') || 'Unbekannt';
  const studioDisplayName = branding.displayAppName || branding.studioName;
  const pdfContactLine = (() => {
    const customFooter = branding.studioSettings.pdf.footerText?.trim();
    if (customFooter) return customFooter;
    return [
      studioDisplayName,
      branding.contact.address,
      branding.contact.phone,
      branding.contact.email,
      branding.contact.website,
    ]
      .filter(Boolean)
      .join(' · ');
  })();

  const handlePrint = useCallback(async () => {
    try {
      await document.fonts?.ready;
    } catch {}
    // 2 Frames warten, damit Layout wirklich steht
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    const root = document.getElementById('pdf-root');
    if (!root) {
      toast.error('PDF-Bereich nicht gefunden.');
      return;
    }

    setIsGenerating(true);
    clearPdfDebug();
    addPdfDebugEvent('info', 'PDF-Export gestartet');

    try {
      const filename = `Kuechen-Beratung_${project.customer.lastName || 'Kunde'}_${new Date().toISOString().split('T')[0]}.pdf`;
      // Dynamischer Import: jspdf + html2canvas landen in einem eigenen Chunk,
      // der erst beim PDF-Export geladen wird (kleineres Initial-Bundle).
      const { exportKitchenPdf } = await import('@/lib/pdf/exportKitchenPdf');
      await exportKitchenPdf({ filename, root });
      addPdfDebugEvent('success', `PDF gespeichert: ${filename}`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      addPdfDebugEvent('error', 'PDF-Generierung fehlgeschlagen', formatUnknownError(error));
      setPdfDebugOpen(true);
      toast.error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsGenerating(false);
    }
  }, [project.customer.lastName, addPdfDebugEvent, clearPdfDebug, formatUnknownError]);

  const generateSummaryHtml = useCallback(() => {
    const customerName = escapeHtml(`${project.customer.firstName} ${project.customer.lastName}`.trim()) || 'Unbekannt';
    const timeline = escapeHtml(TIMELINE_OPTIONS.find(t => t.value === project.customer.timeline)?.label || project.customer.timeline || 'Nicht angegeben');
    
    let html = `
      <div class="section">
        <div class="section-title">👤 Kundendaten</div>
        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${customerName}</span></div>
        <div class="info-row"><span class="info-label">E-Mail:</span><span class="info-value">${escapeHtml(project.customer.email) || '-'}</span></div>
        <div class="info-row"><span class="info-label">Telefon:</span><span class="info-value">${escapeHtml(project.customer.phone) || '-'}</span></div>
        <div class="info-row"><span class="info-label">Adresse:</span><span class="info-value">${escapeHtml(project.customer.address) || '-'}, ${escapeHtml(project.customer.postalCode)} ${escapeHtml(project.customer.city)}</span></div>
        <div class="info-row"><span class="info-label">Zeitrahmen:</span><span class="info-value">${timeline}</span></div>
      </div>
      
      <div class="section">
        <div class="section-title">📐 Raummaße</div>
        <div class="info-row"><span class="info-label">Länge:</span><span class="info-value">${escapeHtml(String(project.room.length))} cm</span></div>
        <div class="info-row"><span class="info-label">Breite:</span><span class="info-value">${escapeHtml(String(project.room.width))} cm</span></div>
        <div class="info-row"><span class="info-label">Höhe:</span><span class="info-value">${escapeHtml(String(project.room.height))} cm</span></div>
      </div>
    `;

    if (project.preferences.style.length > 0) {
      html += `
        <div class="section">
          <div class="section-title">🎨 Stil & Design</div>
          <div>${project.preferences.style.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join(' ')}</div>
        </div>
      `;
    }

    if (project.preferences.colors.length > 0 || project.preferences.materials.length > 0) {
      html += `
        <div class="section">
          <div class="section-title">🎨 Farben & Materialien</div>
          ${project.preferences.colors.length > 0 ? `<div><strong>Farben:</strong> ${project.preferences.colors.map(c => `<span class="tag">${escapeHtml(c)}</span>`).join(' ')}</div>` : ''}
          ${project.preferences.materials.length > 0 ? `<div style="margin-top: 8px;"><strong>Materialien:</strong> ${project.preferences.materials.map(m => `<span class="tag">${escapeHtml(m)}</span>`).join(' ')}</div>` : ''}
        </div>
      `;
    }

    if (project.preferences.appliances.cooktop || project.preferences.appliances.oven || project.preferences.appliances.hood) {
      html += `
        <div class="section">
          <div class="section-title">🍳 Geräte</div>
          ${project.preferences.appliances.cooktop ? `<div class="info-row"><span class="info-label">Kochfeld:</span><span class="info-value">${escapeHtml(project.preferences.appliances.cooktop)}</span></div>` : ''}
          ${project.preferences.appliances.oven ? `<div class="info-row"><span class="info-label">Backofen:</span><span class="info-value">${escapeHtml(project.preferences.appliances.oven)}</span></div>` : ''}
          ${project.preferences.appliances.hood ? `<div class="info-row"><span class="info-label">Dunstabzug:</span><span class="info-value">${escapeHtml(project.preferences.appliances.hood)}</span></div>` : ''}
          ${project.preferences.appliances.fridge ? `<div class="info-row"><span class="info-label">Kühlschrank:</span><span class="info-value">${escapeHtml(project.preferences.appliances.fridge)}</span></div>` : ''}
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
          <p>${escapeHtml(project.additionalNotes)}</p>
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

      // Get timeline label for the CSV
      const timelineLabel = TIMELINE_OPTIONS.find(t => t.value === project.customer.timeline)?.label || project.customer.timeline || '';

      const { data, error } = await supabase.functions.invoke('send-protocol-email', {
        body: {
          studioSlug,
          customerName,
          projectDate,
          summaryHtml,
          customerData: {
            ...project.customer,
            timeline: timelineLabel, // Use the human-readable label
          },
        },
      });

      if (error) throw error;

      setEmailDialogOpen(false);
      setRecipientEmail('');
      setConfirmationDialogOpen(true);
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

  // Check if customer data is complete for sending
  const isCustomerDataComplete = useCallback(() => {
    const { customer } = project;
    return (
      customer.firstName?.trim() &&
      customer.lastName?.trim() &&
      customer.email?.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) &&
      customer.phone?.trim()
    );
  }, [project]);

  // Validate send form fields
  const validateSendForm = useCallback(() => {
    const errors: Record<string, string> = {};
    const { customer } = project;
    
    if (!customer.firstName?.trim()) {
      errors.firstName = 'Vorname ist erforderlich';
    }
    if (!customer.lastName?.trim()) {
      errors.lastName = 'Nachname ist erforderlich';
    }
    if (!customer.email?.trim()) {
      errors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    }
    if (!customer.phone?.trim()) {
      errors.phone = 'Telefon ist erforderlich';
    }
    if (!consentGiven) {
      errors.consent = 'Bitte stimmen Sie der Datenübermittlung zu';
    }
    
    setSendFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [project, consentGiven]);

  // Handle sending from inline form
  const handleSendFromInlineForm = useCallback(async () => {
    if (!validateSendForm()) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus und stimmen der Datenübermittlung zu');
      return;
    }

    // Get studio email from branding
    const studioEmail = branding.contact.email;
    if (!studioEmail) {
      toast.error('Keine Studio-E-Mail konfiguriert. Bitte kontaktieren Sie das Studio direkt.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const customerName = `${project.customer.firstName} ${project.customer.lastName}`.trim();
      const projectDate = formatDate(project.createdAt);
      const summaryHtml = generateSummaryHtml();

      const timelineLabel = TIMELINE_OPTIONS.find(t => t.value === project.customer.timeline)?.label || project.customer.timeline || '';

      const { data, error } = await supabase.functions.invoke('send-protocol-email', {
        body: {
          studioSlug,
          customerName,
          projectDate,
          summaryHtml,
          customerData: {
            ...project.customer,
            timeline: timelineLabel,
          },
        },
      });

      if (error) throw error;

      setShowSendForm(false);
      setConsentGiven(false);
      setSendFormErrors({});
      setConfirmationDialogOpen(true);
    } catch (error: any) {
      console.error('Email sending failed:', error);
      toast.error(`E-Mail konnte nicht gesendet werden: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsSendingEmail(false);
    }
  }, [validateSendForm, branding.contact.email, project, generateSummaryHtml]);

  // CSV Export function
  const handleDownloadCSV = useCallback(() => {
    const timeline = TIMELINE_OPTIONS.find(t => t.value === project.customer.timeline)?.label || project.customer.timeline || '';
    
    // Build CSV rows
    const csvRows: string[][] = [
      ['Kategorie', 'Feld', 'Wert'],
      [''],
      ['=== KUNDENDATEN ===', '', ''],
      ['Kunde', 'Vorname', project.customer.firstName || ''],
      ['Kunde', 'Nachname', project.customer.lastName || ''],
      ['Kunde', 'E-Mail', project.customer.email || ''],
      ['Kunde', 'Telefon', project.customer.phone || ''],
      ['Kunde', 'Straße', project.customer.address || ''],
      ['Kunde', 'PLZ', project.customer.postalCode || ''],
      ['Kunde', 'Ort', project.customer.city || ''],
      ['Timeline', 'Gewünschter Montagezeitraum', timeline],
      ['Budget', 'Minimum (€)', project.preferences.budget.min.toString()],
      ['Budget', 'Maximum (€)', project.preferences.budget.max.toString()],
      [''],
      ['=== RAUMABMESSUNGEN ===', '', ''],
      ['Raum', 'Länge (cm)', project.room.length.toString()],
      ['Raum', 'Breite (cm)', project.room.width.toString()],
      ['Raum', 'Höhe (cm)', project.room.height.toString()],
      ['Raum', 'Form', project.room.shape || ''],
      ['Raum', 'Fläche (m²)', ((project.room.length * project.room.width) / 10000).toFixed(2)],
      [''],
      ['=== ERGONOMIE ===', '', ''],
      ['Ergonomie', 'Körpergröße(n) (cm)', (project.preferences.userHeights || []).join(', ')],
      ['Ergonomie', 'Aktuelle Arbeitsplattenhöhe (cm)', project.preferences.currentCountertopHeight?.toString() || ''],
      ['Ergonomie', 'Zufriedenheit mit aktueller Höhe', project.preferences.currentCountertopSatisfaction || ''],
      ['Ergonomie', 'Kochverhalten', project.preferences.cookingFrequency || ''],
      ['Ergonomie', 'Haushaltsgröße', project.preferences.householdSize || ''],
      ['Ergonomie', 'Griff-Präferenz', project.preferences.gripType || ''],
      [''],
      ['=== STIL & DESIGN ===', '', ''],
      ['Stil', 'Küchenstil', project.preferences.style.join(', ')],
      ['Stil', 'Frontenfarben', project.preferences.colors.join(', ')],
      ['Stil', 'Frontmaterial', project.preferences.materials.join(', ')],
      ['Stil', 'Arbeitsplatte', Array.isArray(project.preferences.countertop) ? project.preferences.countertop.join(', ') : (project.preferences.countertop || '')],
    ];
    
    // Add manufacturer only if enabled in branding
    if (branding.showManufacturerField) {
      csvRows.push(['Stil', 'Hersteller', project.preferences.manufacturers.join(', ')]);
    }
    
    csvRows.push(
      [''],
      ['=== ELEKTROGERÄTE ===', '', ''],
      ['Geräte', 'Kochfeld', project.preferences.appliances.cooktop || ''],
      ['Geräte', 'Dunstabzug', project.preferences.appliances.hood || ''],
      ['Geräte', 'Backofen', project.preferences.appliances.oven || ''],
      ['Geräte', 'Kühlschrank', project.preferences.appliances.fridge || ''],
      ['Geräte', 'Geschirrspüler', project.preferences.appliances.dishwasher ? 'Ja' : 'Nein'],
      ['Geräte', 'Mikrowelle', project.preferences.appliances.microwave ? 'Ja' : 'Nein'],
      [''],
      ['=== SPÜLE & ARMATUR ===', '', ''],
      ['Spüle', 'Material', project.preferences.sink || ''],
      [''],
      ['=== ANSCHLÜSSE ===', '', ''],
    );

    // Add floor plan elements
    project.floorPlan.elements.forEach((element, idx) => {
      csvRows.push([
        'Anschluss',
        `${ELEMENT_TYPE_LABELS[element.type] || element.type} (${WALL_LABELS[element.wall]})`,
        `${element.width}×${element.height}cm, ${element.distanceFromLeft}cm v. links, ${element.distanceFromFloor}cm v. Boden`
      ]);
    });

    csvRows.push(['']);
    csvRows.push(['=== NOTIZEN ===', '', '']);
    csvRows.push(['Notizen', 'Zusätzliche Notizen', (project.additionalNotes || '').replace(/\n/g, ' ')]);

    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';')
    ).join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kuechen-Beratung_${project.customer.lastName || 'Kunde'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('CSV-Export erfolgreich heruntergeladen');
  }, [project, branding.showManufacturerField]);

  // Extract style details from mustHaves
  const frontSurfaces = getTaggedItems(project.preferences.mustHaves, 'Oberfläche:');
  const countertopThickness = getTaggedItems(project.preferences.mustHaves, 'APStärke:');
  const backsplash = getTaggedItems(project.preferences.mustHaves, 'Nische:');
  const freeformMustHaves = getUntaggedItems(project.preferences.mustHaves);

  const hasExtrasPage =
    project.floorPlan.elements.length > 0 ||
    freeformMustHaves.length > 0 ||
    project.preferences.niceToHaves.length > 0 ||
    !!project.additionalNotes?.trim() ||
    !!branding.studioSettings.pdf.privacySnippet?.trim() ||
    !!branding.studioSettings.pdf.termsSnippet?.trim();

  const totalPdfPages = 5 + (hasExtrasPage ? 1 : 0) + photoPages.length;
  const extrasPageNumber = 6;
  const photoPageStart = 5 + (hasExtrasPage ? 1 : 0) + 1;

  const pdfFooter = (pageNumber: number) => (
    <PdfPageFooter
      pageNumber={pageNumber}
      totalPages={totalPdfPages}
      contactLine={pdfContactLine}
      studioName={studioDisplayName}
    />
  );

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

      {/* Confirmation Dialog after successful email send */}
      <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Erfolgreich gesendet!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground">
              Ihre Küchenplanung wurde erfolgreich an das Küchenstudio übermittelt. 
              Sie werden in Kürze kontaktiert.
            </p>
            
            {/* Studio Contact Info */}
            {(branding.studioName || branding.contact.phone || branding.contact.email) && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-foreground">Ihr Küchenstudio:</h4>
                
                {branding.logoUrl && (
                  <img 
                    src={branding.logoUrl} 
                    alt={branding.studioName || 'Studio Logo'} 
                    className="h-10 object-contain"
                  />
                )}
                
                {branding.studioName && (
                  <p className="font-medium text-foreground">{branding.studioName}</p>
                )}
                
                <div className="text-sm text-muted-foreground space-y-1">
                  {branding.contact.address && (
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{branding.contact.address}</span>
                    </p>
                  )}
                  {branding.contact.phone && (
                    <p className="flex items-start gap-2">
                      <Phone className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                      <a href={`tel:${branding.contact.phone}`} className="text-primary hover:underline">
                        {branding.contact.phone}
                      </a>
                    </p>
                  )}
                  {branding.contact.email && (
                    <p className="flex items-start gap-2">
                      <Mail className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                      <a href={`mailto:${branding.contact.email}`} className="text-primary hover:underline">
                        {branding.contact.email}
                      </a>
                    </p>
                  )}
                  {branding.contact.website && (
                    <p className="flex items-start gap-2">
                      <Globe className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                      <a
                        href={branding.contact.website.startsWith('http') ? branding.contact.website : `https://${branding.contact.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {branding.contact.website}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setConfirmationDialogOpen(false)} className="w-full gap-2">
              <CheckCircle className="w-4 h-4" />
              Verstanden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Content */}
      <div id="pdf-root" ref={summaryRef} className="space-y-6 bg-background p-6 rounded-xl">
        {/* ===== PAGE 1: Overview & Customer Data ===== */}
        <div data-pdf-page="1" className="pdf-page">
          <PdfPageHeader
            protocolId={protocolId}
            createdDate={formatDate(project.createdAt)}
            customerName={customerFullName}
            studioName={studioDisplayName}
            logoUrl={branding.logoUrl}
          />
          
          <div className="flex-1 space-y-4">
            {/* HIGHLIGHT BOX - Key Data at a Glance */}
            <div className="pdf-highlight-box">
              <div className="pdf-highlight-grid">
                {/* Timeline */}
                <div className="pdf-highlight-item">
                  <div className="pdf-highlight-label">
                    <CalendarClock className="w-3 h-3" />
                    Zeitrahmen
                  </div>
                  {project.customer.timeline ? (() => {
                    const timelineOption = TIMELINE_OPTIONS.find(t => t.value === project.customer.timeline);
                    return (
                      <div className="pdf-highlight-value">
                        {timelineOption?.label || project.customer.timeline}
                      </div>
                    );
                  })() : (
                    <div className="pdf-highlight-value text-muted-foreground">-</div>
                  )}
                </div>

                {/* Budget */}
                <div className="pdf-highlight-item">
                  <div className="pdf-highlight-label">
                    <Wallet className="w-3 h-3" />
                    Budget
                  </div>
                  <div className="pdf-highlight-value">
                    {project.preferences.budget.min > 0 || project.preferences.budget.max > 0 
                      ? `${project.preferences.budget.min.toLocaleString('de-DE')} - ${project.preferences.budget.max.toLocaleString('de-DE')} EUR`
                      : '-'}
                  </div>
                </div>

                {/* Room Size */}
                <div className="pdf-highlight-item">
                  <div className="pdf-highlight-label">
                    <Ruler className="w-3 h-3" />
                    Raumgroesse
                  </div>
                  <div className="pdf-highlight-value">
                    {((project.room.length * project.room.width) / 10000).toFixed(1)} m2
                  </div>
                  <div className="pdf-highlight-sub">
                    {project.room.length} x {project.room.width} cm
                  </div>
                </div>

                {/* Contact */}
                <div className="pdf-highlight-item">
                  <div className="pdf-highlight-label">
                    <User className="w-3 h-3" />
                    Ansprechpartner
                  </div>
                  <div className="pdf-highlight-value">
                    {customerFullName || '-'}
                  </div>
                  {project.customer.phone && (
                    <div className="pdf-highlight-sub">{project.customer.phone}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="pdf-section">
              <div className="pdf-section-header">
                <User />
                Kundendaten
              </div>
              <div className="pdf-section-body">
                {project.customer.firstName || project.customer.lastName || project.customer.email ? (
                  <div className="pdf-data-grid">
                    {(project.customer.firstName || project.customer.lastName) && (
                      <div className="pdf-data-item">
                        <span className="pdf-data-label">Name</span>
                        <span className="pdf-data-value">{project.customer.firstName} {project.customer.lastName}</span>
                      </div>
                    )}
                    {project.customer.email && (
                      <div className="pdf-data-item">
                        <span className="pdf-data-label">E-Mail</span>
                        <span className="pdf-data-value">{project.customer.email}</span>
                      </div>
                    )}
                    {project.customer.phone && (
                      <div className="pdf-data-item">
                        <span className="pdf-data-label">Telefon</span>
                        <span className="pdf-data-value">{project.customer.phone}</span>
                      </div>
                    )}
                    {(project.customer.address || project.customer.city) && (
                      <div className="pdf-data-item">
                        <span className="pdf-data-label">Adresse</span>
                        <span className="pdf-data-value">
                          {project.customer.address}{project.customer.address && project.customer.postalCode ? ', ' : ''}
                          {project.customer.postalCode} {project.customer.city}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Keine Kontaktdaten angegeben</p>
                )}
                {project.customer.notes && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <span className="pdf-data-label">Anmerkungen</span>
                    <p className="mt-1 text-[9pt]">{project.customer.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ERGONOMIE & NUTZUNG */}
            {(project.preferences.userHeights?.length > 0 || project.preferences.cookingFrequency || project.preferences.householdSize || project.preferences.gripType) && (
              <div className="pdf-section">
                <div className="pdf-section-header">
                  <User />
                  Ergonomie & Nutzung
                </div>
                <div className="pdf-section-body">
                  <div className="pdf-data-grid">
                    {project.preferences.userHeights && project.preferences.userHeights.length > 0 && (
                      <div className="pdf-data-item">
                        <span className="pdf-data-label">Koerpergroesse(n)</span>
                        <div className="pdf-tag-list">
                          {project.preferences.userHeights.map((h, i) => (
                            <span key={i} className="pdf-tag">{h} cm</span>
                          ))}
                        </div>
                        <p className="text-[8pt] text-muted-foreground mt-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          Empf. Arbeitshoehe: {Math.round(
                            project.preferences.userHeights.reduce((sum, h) => sum + (h * 0.6 - 12), 0) /
                              project.preferences.userHeights.length
                          )} cm
                        </p>
                      </div>
                    )}
                    {(project.preferences.currentCountertopHeight || project.preferences.currentCountertopSatisfaction) && (
                      <div className="pdf-data-item">
                        <span className="pdf-data-label">Aktuelle Arbeitsplattenhoehe</span>
                        <span className="pdf-data-value">
                          {project.preferences.currentCountertopHeight ? `${project.preferences.currentCountertopHeight} cm` : '–'}
                          {project.preferences.currentCountertopSatisfaction && (
                            <span className="ml-2 text-muted-foreground">
                              ({project.preferences.currentCountertopSatisfaction === 'sehr-zufrieden' ? 'Sehr zufrieden' :
                                project.preferences.currentCountertopSatisfaction === 'zufrieden' ? 'Zufrieden' :
                                project.preferences.currentCountertopSatisfaction === 'etwas-zu-niedrig' ? 'Etwas zu niedrig' :
                                project.preferences.currentCountertopSatisfaction === 'etwas-zu-hoch' ? 'Etwas zu hoch' :
                                'Keine Meinung'})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {project.preferences.cookingFrequency && (
                      <div className="pdf-data-item">
                        <span className="pdf-data-label">Kochverhalten</span>
                        <span className="pdf-data-value">
                          {project.preferences.cookingFrequency === 'daily' && 'Taeglich'}
                          {project.preferences.cookingFrequency === 'mehrmals' && 'Mehrmals pro Woche'}
                          {project.preferences.cookingFrequency === 'gelegentlich' && 'Gelegentlich'}
                          {project.preferences.cookingFrequency === 'selten' && 'Selten'}
                        </span>
                      </div>
                    )}
                    {project.preferences.householdSize && (
                      <div className="pdf-data-item">
                        <span className="pdf-data-label">Haushaltsgroesse</span>
                        <span className="pdf-data-value">
                          {project.preferences.householdSize === '1' && '1 Person'}
                          {project.preferences.householdSize === '2' && '2 Personen'}
                          {project.preferences.householdSize === '3-4' && '3-4 Personen'}
                          {project.preferences.householdSize === '5+' && '5+ Personen'}
                        </span>
                      </div>
                    )}
                    {project.preferences.gripType && (
                      <div className="pdf-data-item">
                        <span className="pdf-data-label">Griff-Praeferenz</span>
                        <span className="pdf-data-value">
                          {project.preferences.gripType === 'grifflos' && 'Grifflos'}
                          {project.preferences.gripType === 'griffmulde' && 'Griffmulde'}
                          {project.preferences.gripType === 'buegelgriff' && 'Buegelgriff'}
                          {project.preferences.gripType === 'stangengriff' && 'Stangengriff'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STIL & DESIGN */}
            <div className="pdf-section">
              <div className="pdf-section-header">
                <Palette />
                Stil & Design
              </div>
              <div className="pdf-section-body">
                <div className="pdf-data-grid">
                  {project.preferences.style.length > 0 && (
                    <div className="pdf-data-item">
                      <span className="pdf-data-label">Kuechenstil</span>
                      <div className="pdf-tag-list">
                        {project.preferences.style.map((s) => (
                          <span key={s} className="pdf-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.preferences.colors.length > 0 && (
                    <div className="pdf-data-item">
                      <span className="pdf-data-label">Frontenfarben</span>
                      <div className="pdf-tag-list">
                        {project.preferences.colors.map((c) => (
                          <span key={c} className="pdf-tag accent">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.preferences.materials.length > 0 && (
                    <div className="pdf-data-item">
                      <span className="pdf-data-label">Frontmaterial</span>
                      <div className="pdf-tag-list">
                        {project.preferences.materials.map((m) => (
                          <span key={m} className="pdf-tag muted">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {branding.showManufacturerField && (
                    <div className="pdf-data-item">
                      <span className="pdf-data-label">Kuechenhersteller</span>
                      {project.preferences.manufacturers && project.preferences.manufacturers.length > 0 ? (
                        <div className="pdf-tag-list">
                          {project.preferences.manufacturers.map((m) => (
                            <span key={m} className="pdf-tag muted">{m}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="pdf-data-value text-muted-foreground">-</span>
                      )}
                    </div>
                  )}
                  {frontSurfaces.length > 0 && (
                    <div className="pdf-data-item">
                      <span className="pdf-data-label">Frontenoberflaeche</span>
                      <div className="pdf-tag-list">
                        {frontSurfaces.map((s) => (
                          <span key={s} className="pdf-tag muted">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.preferences.countertop.length > 0 && (
                    <div className="pdf-data-item">
                      <span className="pdf-data-label">Arbeitsplatte</span>
                      <div className="pdf-tag-list">
                        {project.preferences.countertop.map((c) => (
                          <span key={c} className="pdf-tag muted">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {countertopThickness.length > 0 && (
                    <div className="pdf-data-item">
                      <span className="pdf-data-label">AP-Staerke</span>
                      <span className="pdf-data-value">{countertopThickness.join(', ')}</span>
                    </div>
                  )}
                  {backsplash.length > 0 && (
                    <div className="pdf-data-item">
                      <span className="pdf-data-label">Nischenrueckwand</span>
                      <div className="pdf-tag-list">
                        {backsplash.map((b) => (
                          <span key={b} className="pdf-tag muted">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.preferences.storage.length > 0 && (
                    <div className="pdf-data-item">
                      <span className="pdf-data-label">Stauraum</span>
                      <div className="pdf-tag-list">
                        {project.preferences.storage.map((s) => (
                          <span key={s} className="pdf-tag muted">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {pdfFooter(1)}
        </div>

        {/* ===== PAGE 2: Sink, Waste, Lighting, Room, Floor Plan ===== */}
        <div data-pdf-page="2" className="pdf-page">
          <PdfPageHeader
            protocolId={protocolId}
            createdDate={formatDate(project.createdAt)}
            customerName={customerFullName}
            studioName={studioDisplayName}
            logoUrl={branding.logoUrl}
          />
          
          <div className="flex-1">
          {/* ELEKTROGERAETE (von Seite 1 hierher verschoben) */}
          <div className="pdf-section">
            <div className="pdf-section-header">
              <Plug />
              Elektrogeraete
            </div>
            <div className="pdf-section-body">
              <div className="pdf-check-list">
                {project.preferences.appliances.cooktop && (
                  <div className="pdf-check-item">
                    <CheckCircle />
                    <div>
                      <span className="font-medium">Kochfeld:</span> {project.preferences.appliances.cooktop}
                      {cooktopSize && <span className="text-muted-foreground"> ({cooktopSize})</span>}
                      {cooktopExtras.length > 0 && (
                        <div className="pdf-tag-list mt-1">
                          {cooktopExtras.map(e => <span key={e} className="pdf-tag accent">{e}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {project.preferences.appliances.hood && (
                  <div className="pdf-check-item">
                    <CheckCircle />
                    <div>
                      <span className="font-medium">Dunstabzug:</span> {project.preferences.appliances.hood}
                      {hoodVentilation && <span className="text-muted-foreground"> ({hoodVentilation})</span>}
                    </div>
                  </div>
                )}
                {project.preferences.appliances.oven && (
                  <div className="pdf-check-item">
                    <CheckCircle />
                    <div>
                      <span className="font-medium">Backofen:</span> {project.preferences.appliances.oven}
                      {ovenHeight && <span className="text-muted-foreground"> ({ovenHeight})</span>}
                      {ovenExtras.length > 0 && (
                        <div className="pdf-tag-list mt-1">
                          {ovenExtras.map(e => <span key={e} className="pdf-tag accent">{e}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {project.preferences.appliances.fridge && (
                  <div className="pdf-check-item">
                    <CheckCircle />
                    <div>
                      <span className="font-medium">Kuehlschrank:</span> {project.preferences.appliances.fridge}
                      {fridgeExtras.length > 0 && (
                        <div className="pdf-tag-list mt-1">
                          {fridgeExtras.map(e => <span key={e} className="pdf-tag accent">{e}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {project.preferences.appliances.dishwasher && (
                  <div className="pdf-check-item">
                    <CheckCircle />
                    <div>
                      <span className="font-medium">Geschirrspueler:</span>
                      <span> {dishwasherWidth || '60 cm'}</span>
                      <span>, {dishwasherHeight || 'Normal (unter AP)'}</span>
                      <span>, {dishwasherIntegration || 'Vollintegriert'}</span>
                    </div>
                  </div>
                )}
                {project.preferences.appliances.microwave && (
                  <div className="pdf-check-item">
                    <CheckCircle />
                    <span>Mikrowelle (Einbau)</span>
                  </div>
                )}
              </div>
              
              {applianceBrands.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <span className="pdf-data-label">Bevorzugte Geraetemarken</span>
                  <div className="pdf-tag-list mt-1">
                    {applianceBrands.map((brand) => (
                      <span key={brand} className="pdf-tag">{brand}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {applianceNotes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <span className="pdf-data-label">Sonstige Wuensche</span>
                  <p className="mt-1">{applianceNotes.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* SPUELE & ARMATUR */}
          <div className="pdf-section">
            <div className="pdf-section-header">
              <Droplets />
              Spuele & Armatur
            </div>
            <div className="pdf-section-body">
              <div className="pdf-data-grid">
                {project.preferences.sink && (
                  <div className="pdf-data-item">
                    <span className="pdf-data-label">Material</span>
                    <span className="pdf-data-value">{project.preferences.sink}</span>
                  </div>
                )}
                {sinkColor.length > 0 && (
                  <div className="pdf-data-item">
                    <span className="pdf-data-label">Farbe</span>
                    <span className="pdf-data-value">{sinkColor.join(', ')}</span>
                  </div>
                )}
                {sinkInstall.length > 0 && (
                  <div className="pdf-data-item">
                    <span className="pdf-data-label">Einbauart</span>
                    <span className="pdf-data-value">{sinkInstall.join(', ')}</span>
                  </div>
                )}
                {sinkSize.length > 0 && (
                  <div className="pdf-data-item">
                    <span className="pdf-data-label">Becken</span>
                    <span className="pdf-data-value">{sinkSize.join(', ')}{hasRestebecken ? ', Restebecken' : ''}</span>
                  </div>
                )}
                {faucetType.length > 0 && (
                  <div className="pdf-data-item">
                    <span className="pdf-data-label">Armatur</span>
                    <span className="pdf-data-value">
                      {faucetType.join(', ')}
                      {(hasAusziehbar || hasSchwenkbar) && ` (${[hasAusziehbar && 'Ausziehbar', hasSchwenkbar && 'Schwenkbar'].filter(Boolean).join(', ')})`}
                    </span>
                  </div>
                )}
                {faucetFinish.length > 0 && (
                  <div className="pdf-data-item">
                    <span className="pdf-data-label">Oberflaeche</span>
                    <span className="pdf-data-value">{faucetFinish.join(', ')}</span>
                  </div>
                )}
                {sinkBrands.length > 0 && (
                  <div className="pdf-data-item">
                    <span className="pdf-data-label">Hersteller</span>
                    <div className="pdf-tag-list">
                      {sinkBrands.map((b) => (
                        <span key={b} className="pdf-tag muted">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {faucetExtras.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <span className="pdf-data-label">Zusatzfunktionen</span>
                  <div className="pdf-tag-list mt-1">
                    {faucetExtras.map((extra) => (
                      <span key={extra} className="pdf-tag accent">{extra}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MUELL & BELEUCHTUNG - nebeneinander mit flex-wrap für alle Elemente */}
          <div className="pdf-section">
            <div className="pdf-section-header">
              <Trash2 />
              Muellsystem & Beleuchtung
            </div>
            <div className="pdf-section-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[8pt] font-medium text-muted-foreground mb-1">MÜLLSYSTEM</p>
                  {wasteSystem.length > 0 ? (
                    <div className="pdf-tag-list">
                      {wasteSystem.map((w) => (
                        <span key={w} className="pdf-tag muted">{w}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-[9pt]">Nicht angegeben</p>
                  )}
                </div>
                <div>
                  <p className="text-[8pt] font-medium text-muted-foreground mb-1">BELEUCHTUNG</p>
                  {lightingOptions.length > 0 ? (
                    <div className="pdf-tag-list">
                      {lightingOptions.map((l) => (
                        <span key={l} className="pdf-tag muted">{l}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-[9pt]">Nicht angegeben</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
          {pdfFooter(2)}
        </div>

        {/* ===== PAGE 3: Raummaße & Grundriss (dedizierte Seite) ===== */}
        <div data-pdf-page="3" className="pdf-page">
          <PdfPageHeader
            protocolId={protocolId}
            createdDate={formatDate(project.createdAt)}
            customerName={customerFullName}
            studioName={studioDisplayName}
            logoUrl={branding.logoUrl}
          />
          
          <div className="flex-1">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-lg">
            <Ruler className="w-5 h-5 text-primary" />
            Raummaße & Grundriss
          </h3>
          
          {/* Room Dimensions */}
          <div className="pdf-section mb-4">
            <div className="pdf-section-header">
              <Ruler />
              Raummasse
            </div>
            <div className="pdf-section-body">
              <div className="pdf-highlight-grid">
                <div className="pdf-highlight-item">
                  <div className="pdf-highlight-value">{project.room.length}</div>
                  <div className="pdf-highlight-sub">Laenge (cm)</div>
                </div>
                <div className="pdf-highlight-item">
                  <div className="pdf-highlight-value">{project.room.width}</div>
                  <div className="pdf-highlight-sub">Breite (cm)</div>
                </div>
                <div className="pdf-highlight-item">
                  <div className="pdf-highlight-value">{project.room.height}</div>
                  <div className="pdf-highlight-sub">Hoehe (cm)</div>
                </div>
                <div className="pdf-highlight-item">
                  <div className="pdf-highlight-value">{((project.room.length * project.room.width) / 10000).toFixed(1)} m2</div>
                  <div className="pdf-highlight-sub">Flaeche</div>
                </div>
              </div>
              <div className="mt-3 pdf-data-item">
                <span className="pdf-data-label">Raumform</span>
                <span className="pdf-data-value">
                  {project.room.shape === 'rectangular' && 'Rechteckig'}
                  {project.room.shape === 'l-shaped' && 'L-Form'}
                  {project.room.shape === 'u-shaped' && 'U-Form'}
                  {project.room.shape === 'galley' && 'Schlauch'}
                </span>
              </div>
            </div>
          </div>

          {/* Floor Plan Visual - larger on dedicated page */}
          <div className="pdf-section">
            <div className="pdf-section-header">
              <LayoutGrid />
              Grundriss
            </div>
            <div className="pdf-section-body">
              <div className="pdf-canvas-container" style={{ minHeight: '450px' }}>
                <FloorPlanCanvas 
                  room={project.room} 
                  elements={project.floorPlan.elements}
                  dataCanvasKey="floorplan"
                />
              </div>
            </div>
          </div>
        </div>
          {pdfFooter(3)}
        </div>

        {/* ===== PAGE 4: Wall Views Nord & Ost ===== */}
        <div data-pdf-page="4" className="pdf-page">
          <PdfPageHeader
            protocolId={protocolId}
            createdDate={formatDate(project.createdAt)}
            customerName={customerFullName}
            studioName={studioDisplayName}
            logoUrl={branding.logoUrl}
          />
          
          <div className="flex-1">
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
                    dataCanvasKey={`wall-${wall}`}
                  />
                </div>
              </div>
            );
          })}
          </div>
          {pdfFooter(4)}
        </div>

        {/* ===== PAGE 5: Wall Views Süd & West + Element Table ===== */}
        <div data-pdf-page="5" className="pdf-page">
          <PdfPageHeader
            protocolId={protocolId}
            createdDate={formatDate(project.createdAt)}
            customerName={customerFullName}
            studioName={studioDisplayName}
            logoUrl={branding.logoUrl}
          />
          
          <div className="flex-1">
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
                    dataCanvasKey={`wall-${wall}`}
                  />
                </div>
              </div>
            );
          })}
          </div>
          {pdfFooter(5)}
        </div>

        {/* ===== PAGE 6 (optional): Elemente, Must-haves, Notizen ===== */}
        {hasExtrasPage && (
        <div data-pdf-page={String(extrasPageNumber)} className="pdf-page">
          <PdfPageHeader
            protocolId={protocolId}
            createdDate={formatDate(project.createdAt)}
            customerName={customerFullName}
            studioName={studioDisplayName}
            logoUrl={branding.logoUrl}
          />
          
          <div className="flex-1">
          {project.floorPlan.elements.length > 0 && (
            <div className="pdf-section mb-4">
              <div className="pdf-section-header">
                <FileText />
                Eingetragene Elemente ({project.floorPlan.elements.length})
              </div>
              <div className="pdf-section-body">
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

          {project.additionalNotes?.trim() && (
            <div className="pdf-section mb-4">
              <div className="pdf-section-header">
                <StickyNote />
                Zusätzliche Notizen
              </div>
              <div className="pdf-section-body">
                <p className="whitespace-pre-wrap text-sm">{project.additionalNotes}</p>
              </div>
            </div>
          )}

          {(branding.studioSettings.pdf.privacySnippet || branding.studioSettings.pdf.termsSnippet) && (
            <div className="pdf-section">
              <div className="pdf-section-header">
                <FileText />
                Hinweise
              </div>
              <div className="pdf-section-body text-sm space-y-2">
                {branding.studioSettings.pdf.privacySnippet && (
                  <p>{branding.studioSettings.pdf.privacySnippet}</p>
                )}
                {branding.studioSettings.pdf.termsSnippet && (
                  <p>{branding.studioSettings.pdf.termsSnippet}</p>
                )}
              </div>
            </div>
          )}

          </div>
          {pdfFooter(extrasPageNumber)}
        </div>
        )}

        {/* ===== PHOTO PAGES: Separate PDF pages for photos ===== */}
        {photoPages.map((pagePhotos, idx) => {
          const pageNumber = photoPageStart + idx;
          return (
            <div key={idx} data-pdf-page={String(pageNumber)} className="pdf-page">
              <PdfPageHeader
                protocolId={protocolId}
                createdDate={formatDate(project.createdAt)}
                customerName={customerFullName}
                studioName={studioDisplayName}
                logoUrl={branding.logoUrl}
              />
              <div className="flex-1">
                <div className="pdf-section">
                  <div className="pdf-section-header">
                    <Camera />
                    Fotos ({idx + 1}/{photoPages.length})
                  </div>
                  <div className="pdf-section-body">
                    <div className="grid grid-cols-2 gap-4">
                      {pagePhotos.map((photo) => (
                        <div key={photo.id} className="overflow-hidden rounded-lg border border-border">
                          <img
                            src={photo.preview}
                            alt={photo.type === "room" ? "Raumfoto" : "Inspiration"}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-2 bg-muted/50">
                            <p className="text-xs text-muted-foreground">
                              {photo.type === "room" ? "Raumfoto" : "Inspiration"}
                              {photo.description ? `, ${photo.description}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {pdfFooter(pageNumber)}
            </div>
          );
        })}

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
        {(branding.studioName || branding.contact.address || branding.contact.phone || branding.contact.email || branding.contact.website) && (
          <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            {/* Studio Logo and Name */}
            <div className="flex items-center justify-center gap-3 mb-3">
              {branding.logoUrl && (
                <img 
                  src={branding.logoUrl} 
                  alt={branding.studioName || 'Studio Logo'} 
                  className="h-10 w-auto object-contain"
                />
              )}
              {branding.studioName && (
                <span className="font-semibold text-foreground text-base">{branding.studioName}</span>
              )}
            </div>
            {/* Contact Details */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {branding.contact.address && <span>{branding.contact.address}</span>}
              {branding.contact.phone && <span>Tel: {branding.contact.phone}</span>}
              {branding.contact.email && <span>{branding.contact.email}</span>}
              {branding.contact.website && <span>{branding.contact.website}</span>}
            </div>
          </div>
        )}

        {/* Action Buttons - Print & PDF */}
        <div className="flex flex-wrap gap-3 justify-center no-print pt-4">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Drucken
          </Button>
          {branding.featureConfig.pdfExport && (
            <Button onClick={handleDownloadPDF} className="gap-2" disabled={isGenerating}>
              <Download className="w-4 h-4" />
              {isGenerating ? 'Wird erstellt...' : 'Als PDF speichern'}
            </Button>
          )}
          {import.meta.env.DEV && (
            <Button onClick={() => setPdfDebugOpen(true)} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              PDF-Debug{pdfDebugEvents.length ? ` (${pdfDebugEvents.length})` : ''}
            </Button>
          )}
        </div>

        {/* Send to Studio Section */}
        {branding.featureConfig.protocolEmail && (
        <div className="kitchen-card p-6 no-print mt-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Protokoll ans Studio senden
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Senden Sie Ihre Küchenplanung direkt an {branding.studioName || 'das Küchenstudio'}
            </p>
          </div>

          {!showSendForm ? (
            <div className="text-center">
              <Button 
                onClick={() => setShowSendForm(true)} 
                size="lg" 
                className="gap-2"
              >
                <Mail className="w-5 h-5" />
                Jetzt absenden
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              {/* Contact Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="send-firstName" className="flex items-center gap-1">
                    Vorname <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="send-firstName"
                    value={project.customer.firstName}
                    onChange={(e) => onUpdateCustomer?.({ firstName: e.target.value })}
                    placeholder="Max"
                    className={sendFormErrors.firstName ? 'border-destructive' : ''}
                  />
                  {sendFormErrors.firstName && (
                    <p className="text-xs text-destructive">{sendFormErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="send-lastName" className="flex items-center gap-1">
                    Nachname <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="send-lastName"
                    value={project.customer.lastName}
                    onChange={(e) => onUpdateCustomer?.({ lastName: e.target.value })}
                    placeholder="Mustermann"
                    className={sendFormErrors.lastName ? 'border-destructive' : ''}
                  />
                  {sendFormErrors.lastName && (
                    <p className="text-xs text-destructive">{sendFormErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="send-email" className="flex items-center gap-1">
                  E-Mail <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="send-email"
                  type="email"
                  value={project.customer.email}
                  onChange={(e) => onUpdateCustomer?.({ email: e.target.value })}
                  placeholder="max.mustermann@email.de"
                  className={sendFormErrors.email ? 'border-destructive' : ''}
                />
                {sendFormErrors.email && (
                  <p className="text-xs text-destructive">{sendFormErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="send-phone" className="flex items-center gap-1">
                  Telefon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="send-phone"
                  type="tel"
                  value={project.customer.phone}
                  onChange={(e) => onUpdateCustomer?.({ phone: e.target.value })}
                  placeholder="+49 123 456789"
                  className={sendFormErrors.phone ? 'border-destructive' : ''}
                />
                {sendFormErrors.phone && (
                  <p className="text-xs text-destructive">{sendFormErrors.phone}</p>
                )}
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked === true)}
                  className={sendFormErrors.consent ? 'border-destructive' : ''}
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor="consent" 
                    className="text-sm font-normal leading-relaxed cursor-pointer"
                  >
                    {branding.studioSettings.legal.consentText?.trim() ||
                      `Ich willige ein, dass meine Daten an ${studioDisplayName} zur Vorbereitung des Küchenberatungstermins verarbeitet werden.`}
                    {' '}<span className="text-destructive">*</span>
                  </Label>
                  {(branding.privacyUrl || branding.imprintUrl) && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {branding.privacyUrl && (
                        <a href={branding.privacyUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          Datenschutz
                        </a>
                      )}
                      {branding.privacyUrl && branding.imprintUrl && ' · '}
                      {branding.imprintUrl && (
                        <a href={branding.imprintUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          Impressum
                        </a>
                      )}
                    </p>
                  )}
                  {sendFormErrors.consent && (
                    <p className="text-xs text-destructive">{sendFormErrors.consent}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSendForm(false);
                    setSendFormErrors({});
                  }}
                  disabled={isSendingEmail}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSendFromInlineForm}
                  disabled={isSendingEmail}
                  className="flex-1 gap-2"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Absenden
                    </>
                  )}
                </Button>
              </div>

              {!branding.contact.email && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Keine Studio-E-Mail konfiguriert. Bitte kontaktieren Sie das Studio direkt.</span>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Appointment Request - only show if configured */}
        {branding.showAppointmentBooking && (
          <div className="no-print mt-4">
            <AppointmentRequest
              customerName={`${project.customer.firstName} ${project.customer.lastName}`.trim()}
              customerEmail={project.customer.email}
              customerPhone={project.customer.phone}
            />
          </div>
        )}

        <PdfDebugConsole
          open={pdfDebugOpen}
          onOpenChange={setPdfDebugOpen}
          events={pdfDebugEvents}
          onClear={clearPdfDebug}
        />
      </div>
    </motion.div>
  );
}
