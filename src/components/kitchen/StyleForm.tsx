import { KitchenPreferences, KITCHEN_STYLES, KITCHEN_COLORS, KITCHEN_MATERIALS, KITCHEN_MANUFACTURERS, COUNTERTOP_MATERIALS, STORAGE_OPTIONS } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Palette, Heart, Star, Euro, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface StyleFormProps {
  data: KitchenPreferences;
  onChange: (data: Partial<KitchenPreferences>) => void;
}

export function StyleForm({ data, onChange }: StyleFormProps) {
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
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Stil & Design</h2>
        <p className="text-muted-foreground mt-2">Welchen Look soll Ihre Traumküche haben?</p>
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" />Küchenstil</h3>
        <p className="text-sm text-muted-foreground">Welcher Stil entspricht Ihrem Geschmack? Mehrfachauswahl möglich.</p>
        <Chip items={KITCHEN_STYLES} field="style" />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" />Farbwünsche Fronten</h3>
        <p className="text-sm text-muted-foreground">Welche Farben bevorzugen Sie für die Küchenfronten?</p>
        <Chip items={KITCHEN_COLORS} field="colors" />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Frontmaterial & Oberfläche</h3>
        <p className="text-sm text-muted-foreground">Welche Materialien und Oberflächen sprechen Sie an?</p>
        <Chip items={KITCHEN_MATERIALS} field="materials" />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Arbeitsplatte</h3>
        <p className="text-sm text-muted-foreground">Welches Material soll die Arbeitsplatte haben?</p>
        <Chip items={COUNTERTOP_MATERIALS} field="countertop" accent />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Bevorzugte Küchenhersteller</h3>
        <p className="text-sm text-muted-foreground">Haben Sie Präferenzen bei Küchenmarken?</p>
        <Chip items={KITCHEN_MANUFACTURERS} field="manufacturers" />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Stauraum-Lösungen</h3>
        <p className="text-sm text-muted-foreground">Welche speziellen Stauräume sind gewünscht?</p>
        <Chip items={STORAGE_OPTIONS} field="storage" accent />
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Euro className="w-5 h-5 text-primary" />Budgetrahmen</h3>
        <p className="text-sm text-muted-foreground">In welchem Preisbereich soll sich die Küche bewegen?</p>
        <div className="flex justify-between text-sm mt-4"><span>€{data.budget.min.toLocaleString()}</span><span>€{data.budget.max.toLocaleString()}</span></div>
        <Slider value={[data.budget.min, data.budget.max]} min={5000} max={100000} step={1000} onValueChange={([min, max]) => onChange({ budget: { min, max } })} />
        <p className="text-center text-muted-foreground">Budget: €{data.budget.min.toLocaleString()} - €{data.budget.max.toLocaleString()}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="kitchen-card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Heart className="w-5 h-5 text-destructive" />Must-Haves</h3>
          <p className="text-sm text-muted-foreground">Was muss die Küche unbedingt haben?</p>
          <Textarea value={data.mustHaves.join('\n')} onChange={e => onChange({ mustHaves: e.target.value.split('\n').filter(s => s.trim()) })} placeholder="Ein Wunsch pro Zeile" className="kitchen-input min-h-[120px]" />
        </div>
        <div className="kitchen-card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Nice-to-Haves</h3>
          <p className="text-sm text-muted-foreground">Was wäre schön, ist aber nicht zwingend?</p>
          <Textarea value={data.niceToHaves.join('\n')} onChange={e => onChange({ niceToHaves: e.target.value.split('\n').filter(s => s.trim()) })} placeholder="Ein Wunsch pro Zeile" className="kitchen-input min-h-[120px]" />
        </div>
      </div>
    </motion.div>
  );
}
