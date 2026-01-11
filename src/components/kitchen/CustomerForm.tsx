import { CustomerData } from '@/types/kitchen';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomerFormProps {
  data: CustomerData;
  onChange: (data: Partial<CustomerData>) => void;
}

export function CustomerForm({ data, onChange }: CustomerFormProps) {
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
        <div className="mt-4 inline-flex items-center gap-2 bg-muted/50 text-muted-foreground text-sm px-4 py-2 rounded-full">
          <span className="text-lg">💡</span>
          <span>Optional – Sie können diesen Schritt auch überspringen</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Vorname
          </Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Max"
            className="kitchen-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Nachname
          </Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Mustermann"
            className="kitchen-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-Mail
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="max.mustermann@email.de"
            className="kitchen-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Telefon
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+49 123 456789"
            className="kitchen-input"
          />
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