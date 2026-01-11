import { KitchenPreferences, KITCHEN_STYLES, KITCHEN_COLORS, KITCHEN_MATERIALS, KITCHEN_MANUFACTURERS, APPLIANCE_TYPES, COUNTERTOP_MATERIALS, STORAGE_OPTIONS } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Heart, Star, Euro, ChefHat, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface PreferencesFormProps {
  data: KitchenPreferences;
  onChange: (data: Partial<KitchenPreferences>) => void;
}

export function PreferencesForm({ data, onChange }: PreferencesFormProps) {
  const toggle = (arr: string[], item: string) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const Chip = ({ items, field, accent }: { items: string[]; field: keyof KitchenPreferences; accent?: boolean }) => (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <button key={item} onClick={() => onChange({ [field]: toggle((data[field] as string[]), item) })}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${(data[field] as string[]).includes(item) ? accent ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
          {item}
        </button>
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Wünsche & Vorlieben</h2>
        <p className="text-muted-foreground mt-2">Stil, Materialien, Geräte und Budget</p>
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" />Küchenstil</h3>
        <Chip items={KITCHEN_STYLES} field="style" />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" />Farbwünsche</h3>
        <Chip items={KITCHEN_COLORS} field="colors" />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Frontmaterial</h3>
        <Chip items={KITCHEN_MATERIALS} field="materials" />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Arbeitsplatte</h3>
        <Chip items={COUNTERTOP_MATERIALS} field="countertop" accent />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Bevorzugte Hersteller</h3>
        <Chip items={KITCHEN_MANUFACTURERS} field="manufacturers" />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary" />Elektrogeräte</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {(['cooktop', 'oven', 'fridge', 'hood'] as const).map(key => (
            <div key={key} className="space-y-2">
              <Label>{key === 'cooktop' ? 'Kochfeld' : key === 'oven' ? 'Backofen' : key === 'fridge' ? 'Kühlschrank' : 'Dunstabzug'}</Label>
              <Select value={data.appliances[key]} onValueChange={v => onChange({ appliances: { ...data.appliances, [key]: v } })}>
                <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
                <SelectContent>{APPLIANCE_TYPES[key].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-6 pt-4">
          <div className="flex items-center gap-2">
            <Checkbox id="dw" checked={data.appliances.dishwasher} onCheckedChange={c => onChange({ appliances: { ...data.appliances, dishwasher: !!c } })} />
            <Label htmlFor="dw">Geschirrspüler</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="mw" checked={data.appliances.microwave} onCheckedChange={c => onChange({ appliances: { ...data.appliances, microwave: !!c } })} />
            <Label htmlFor="mw">Mikrowelle</Label>
          </div>
        </div>
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Stauraum-Lösungen</h3>
        <Chip items={STORAGE_OPTIONS} field="storage" accent />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Euro className="w-5 h-5 text-primary" />Budgetrahmen</h3>
        <div className="flex justify-between text-sm"><span>€{data.budget.min.toLocaleString()}</span><span>€{data.budget.max.toLocaleString()}</span></div>
        <Slider value={[data.budget.min, data.budget.max]} min={5000} max={100000} step={1000} onValueChange={([min, max]) => onChange({ budget: { min, max } })} />
        <p className="text-center text-muted-foreground">Budget: €{data.budget.min.toLocaleString()} - €{data.budget.max.toLocaleString()}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="kitchen-card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Heart className="w-5 h-5 text-destructive" />Must-Haves</h3>
          <Textarea value={data.mustHaves.join('\n')} onChange={e => onChange({ mustHaves: e.target.value.split('\n').filter(s => s.trim()) })} placeholder="Ein Wunsch pro Zeile" className="kitchen-input min-h-[120px]" />
        </div>
        <div className="kitchen-card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Nice-to-Haves</h3>
          <Textarea value={data.niceToHaves.join('\n')} onChange={e => onChange({ niceToHaves: e.target.value.split('\n').filter(s => s.trim()) })} placeholder="Ein Wunsch pro Zeile" className="kitchen-input min-h-[120px]" />
        </div>
      </div>
    </motion.div>
  );
}