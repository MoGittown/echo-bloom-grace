import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { escapeHtml } from '@/lib/htmlSanitizer';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarDays, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBranding } from '@/hooks/useBranding';
import { de } from 'date-fns/locale';

interface AppointmentRequestProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess?: () => void;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

export function AppointmentRequest({ 
  customerName, 
  customerEmail, 
  customerPhone,
  onSuccess 
}: AppointmentRequestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { slug } = useParams<{ slug?: string }>();
  const { branding } = useBranding(slug);

  // Don't show if appointment booking is disabled
  if (!branding.showAppointmentBooking) {
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Bitte wählen Sie Datum und Uhrzeit');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('appointment_requests')
        .insert({
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          requested_date: selectedDate.toISOString().split('T')[0],
          requested_time: selectedTime,
        });

      if (dbError) throw dbError;

      // Send notification email to studio
      if (branding.contact.email) {
        await supabase.functions.invoke('send-protocol-email', {
          body: {
            studioSlug: slug,
            customerName,
            projectDate: new Date().toLocaleDateString('de-DE'),
            summaryHtml: `
              <div class="section">
                <div class="section-title">📅 Neue Terminanfrage</div>
                <div class="info-row"><span class="info-label">Kunde:</span><span class="info-value">${escapeHtml(customerName)}</span></div>
                <div class="info-row"><span class="info-label">E-Mail:</span><span class="info-value">${escapeHtml(customerEmail) || '-'}</span></div>
                <div class="info-row"><span class="info-label">Telefon:</span><span class="info-value">${escapeHtml(customerPhone) || '-'}</span></div>
                <div class="info-row"><span class="info-label">Wunschdatum:</span><span class="info-value">${selectedDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                <div class="info-row"><span class="info-label">Wunschzeit:</span><span class="info-value">${escapeHtml(selectedTime)} Uhr</span></div>
              </div>
              <p style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; color: #856404;">
                ⚠️ <strong>Bitte bestätigen Sie diesen Termin</strong> telefonisch oder per E-Mail beim Kunden.
              </p>
            `,
          },
        });
      }

      setIsSuccess(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Appointment request failed:', error);
      toast.error('Terminanfrage konnte nicht gesendet werden');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setSelectedDate(undefined);
    setSelectedTime('');
    setIsSuccess(false);
  };

  // Disable past dates and weekends
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = date.getDay();
    return date < today || day === 0 || day === 6;
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <CalendarDays className="w-4 h-4" />
        Termin anfragen
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          {isSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  Terminanfrage gesendet!
                </DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <p className="text-muted-foreground">
                  Ihre Terminanfrage wurde erfolgreich übermittelt.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-medium">Ihr Wunschtermin:</p>
                  <p className="text-lg mt-1">
                    {selectedDate?.toLocaleDateString('de-DE', { 
                      weekday: 'long', 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })} um {selectedTime} Uhr
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Das Küchenstudio wird sich in Kürze bei Ihnen melden, um den Termin zu bestätigen.
                </p>
                
                {/* Studio Contact Info */}
                {(branding.studioName || branding.contact.phone) && (
                  <div className="bg-primary/5 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-sm mb-2">Bei Fragen erreichen Sie uns unter:</h4>
                    {branding.contact.phone && (
                      <p className="text-sm">📞 <a href={`tel:${branding.contact.phone}`} className="text-primary hover:underline">{branding.contact.phone}</a></p>
                    )}
                    {branding.contact.email && (
                      <p className="text-sm">✉️ <a href={`mailto:${branding.contact.email}`} className="text-primary hover:underline">{branding.contact.email}</a></p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={resetAndClose} className="w-full">
                  Schließen
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Beratungstermin anfragen
                </DialogTitle>
                <DialogDescription>
                  Wählen Sie Ihren Wunschtermin. Das Studio wird sich zur Bestätigung bei Ihnen melden.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-6">
                {/* Date Selection */}
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={disabledDays}
                    locale={de}
                    className="rounded-md border"
                  />
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Uhrzeit wählen
                    </Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Uhrzeit auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time} Uhr
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Summary */}
                {selectedDate && selectedTime && (
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <p className="text-muted-foreground">Ihr Wunschtermin:</p>
                    <p className="font-medium text-base mt-1">
                      {selectedDate.toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })} um {selectedTime} Uhr
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={resetAndClose}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedDate || !selectedTime}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4" />
                      Termin anfragen
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
