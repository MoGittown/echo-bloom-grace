import { KitchenPreferences, KITCHEN_STYLES, KITCHEN_COLORS, KITCHEN_MATERIALS, KITCHEN_MANUFACTURERS, COUNTERTOP_MATERIALS, STORAGE_OPTIONS } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Palette, Heart, Star, Euro, Package, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

interface StyleFormProps {
  data: KitchenPreferences;
  onChange: (data: Partial<KitchenPreferences>) => void;
}

const FRONT_SURFACES = ['Matt', 'Hochglanz', 'Lack', 'Echtholz', 'Furnier', 'Folie', 'Anti-Fingerprint'];
const COUNTERTOP_THICKNESS = ['12mm (dünn/modern)', '20mm (Standard)', '30mm', '40mm+'];
const BACKSPLASH_MATERIALS = ['Glas', 'Fliesen', 'Nischenpaneel', 'Naturstein', 'Arbeitsplatte fortführen', 'Edelstahl'];

export function StyleForm({ data, onChange }: StyleFormProps) {
  const toggle = (arr: string[], item: string) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const toggleExtra = (item: string) => {
    const current = data.mustHaves || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    onChange({ mustHaves: updated });
  };

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

      {/* NEU: Frontenoberfläche */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Layers className="w-5 h-5 text-primary" />Oberfläche der Fronten</h3>
        <p className="text-sm text-muted-foreground">Matt, hochglänzend oder mit besonderer Beschichtung?</p>
        <div className="flex flex-wrap gap-2">
          {FRONT_SURFACES.map(surface => (
            <button key={surface} onClick={() => toggleExtra(`Oberfläche:${surface}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.mustHaves?.includes(`Oberfläche:${surface}`) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {surface}
            </button>
          ))}
        </div>
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Arbeitsplatte - Material</h3>
        <p className="text-sm text-muted-foreground">Welches Material soll die Arbeitsplatte haben?</p>
        <Chip items={COUNTERTOP_MATERIALS} field="countertop" accent />
      </div>

      {/* NEU: Arbeitsplattenstärke */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Arbeitsplatte - Stärke</h3>
        <p className="text-sm text-muted-foreground">Wie dick soll die Arbeitsplatte sein?</p>
        <RadioGroup 
          value={data.mustHaves?.find(m => m.startsWith('APStärke:'))?.replace('APStärke:', '') || ''} 
          onValueChange={v => {
            const filtered = (data.mustHaves || []).filter(m => !m.startsWith('APStärke:'));
            onChange({ mustHaves: [...filtered, `APStärke:${v}`] });
          }}>
          <div className="flex flex-wrap gap-4">
            {COUNTERTOP_THICKNESS.map(thickness => (
              <div key={thickness} className="flex items-center gap-2">
                <RadioGroupItem value={thickness} id={`thick-${thickness}`} />
                <Label htmlFor={`thick-${thickness}`}>{thickness}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* NEU: Nischenrückwand */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Nischenrückwand / Spritzschutz</h3>
        <p className="text-sm text-muted-foreground">Welches Material soll die Rückwand zwischen Arbeitsplatte und Oberschränken haben?</p>
        <div className="flex flex-wrap gap-2">
          {BACKSPLASH_MATERIALS.map(material => (
            <button key={material} onClick={() => toggleExtra(`Nische:${material}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.mustHaves?.includes(`Nische:${material}`) ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {material}
            </button>
          ))}
        </div>
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
          <Textarea 
            value={data.mustHaves?.filter(m => !m.includes(':')).join('\n') || ''} 
            onChange={e => {
              const tagged = (data.mustHaves || []).filter(m => m.includes(':'));
              const freeform = e.target.value.split('\n').filter(s => s.trim());
              onChange({ mustHaves: [...tagged, ...freeform] });
            }} 
            placeholder="Ein Wunsch pro Zeile" 
            className="kitchen-input min-h-[120px]" 
          />
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
