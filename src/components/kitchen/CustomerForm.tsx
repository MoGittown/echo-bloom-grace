import { CustomerData, TIMELINE_OPTIONS } from '@/types/kitchen';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomerFormProps {
  data: CustomerData;
  onChange: (data: Partial<CustomerData>) => void;
  errors?: Record<string, string>;
}

export function CustomerForm({ data, onChange, errors = {} }: CustomerFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Kontaktdaten
        </h2>
        <p className="text-muted-foreground mt-2">
          Erfassen Sie die Kontaktdaten des Kunden
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-2 rounded-full">
          <AlertCircle className="w-4 h-4" />
          <span>Pflichtfelder – bitte vollständig ausfüllen</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Vorname <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Max"
            className={`kitchen-input ${errors.firstName ? 'border-destructive' : ''}`}
            required
          />
          {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Nachname <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Mustermann"
            className={`kitchen-input ${errors.lastName ? 'border-destructive' : ''}`}
            required
          />
          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-Mail <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="max.mustermann@email.de"
            className={`kitchen-input ${errors.email ? 'border-destructive' : ''}`}
            required
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Telefon <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+49 123 456789"
            className={`kitchen-input ${errors.phone ? 'border-destructive' : ''}`}
            required
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Straße & Hausnummer
        </Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Musterstraße 123"
          className="kitchen-input"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="postalCode">PLZ</Label>
          <Input
            id="postalCode"
            value={data.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            placeholder="12345"
            className="kitchen-input"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="city">Stadt</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Musterstadt"
            className="kitchen-input"
          />
        </div>
      </div>

      {/* Timeline Selection - Important for Lead Qualification */}
      <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <Label htmlFor="timeline" className="flex items-center gap-2 text-base font-medium">
          <Calendar className="w-5 h-5 text-primary" />
          Wann soll die Küche montiert werden?
        </Label>
        <p className="text-sm text-muted-foreground">
          Diese Information hilft uns, Ihre Anfrage optimal zu priorisieren.
        </p>
        <Select
          value={data.timeline}
          onValueChange={(value) => onChange({ timeline: value })}
        >
          <SelectTrigger className="kitchen-input">
            <SelectValue placeholder="Bitte Zeitraum auswählen" />
          </SelectTrigger>
          <SelectContent>
            {TIMELINE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.priority === 'high' && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                  {option.priority === 'medium' && (
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  )}
                  {option.priority === 'low' && (
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full" />
                  )}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data.timeline && ['sofort', '1-3-monate'].includes(data.timeline) && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <AlertCircle className="w-4 h-4" />
            <span>Hohe Priorität – baldiger Montagetermin gewünscht</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Anmerkungen zum Kunden</Label>
        <Textarea
          id="notes"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Besondere Wünsche, Terminpräferenzen, etc."
          className="kitchen-input min-h-[100px]"
        />
      </div>
    </motion.div>
  );
}