import { KitchenPreferences } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Droplets, Lightbulb, Info, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SinkFormProps {
  data: KitchenPreferences;
  onChange: (data: Partial<KitchenPreferences>) => void;
}

const SINK_MATERIALS = ['Edelstahl', 'Granit/Silgranit', 'Keramik', 'Quarzkomposit', 'Kupfer', 'Verbundwerkstoff'];
const SINK_COLORS = ['Edelstahl', 'Schwarz', 'Weiß', 'Anthrazit', 'Beige/Sand'];
const SINK_TYPES = ['Einbauspüle (Auflage)', 'Unterbauspüle', 'Flächenbündig', 'Integriert in Arbeitsplatte'];
const SINK_SIZES = ['Einzelbecken', 'Doppelbecken', '1,5 Becken', 'XL-Becken', 'Mit Abtropffläche'];
const FAUCET_TYPES = ['Einhebelmischer', 'Ausziehbare Brause', 'Spiralfeder-Armatur', 'Sensor/Berührungslos', 'Wandmontage', 'Vorfenster (versenkbar)', 'Semiprofessionell'];
const FAUCET_FINISHES = ['Chrom', 'Edelstahl', 'Schwarz matt', 'Anthrazit', 'Gold/Messing', 'Kupfer'];
const FAUCET_EXTRAS = ['Wasserfilter-System', 'Kochendwasser (Quooker etc.)', 'Sprudelwasser', 'Gekühltes Wasser'];
const WASTE_SYSTEMS = ['Auszug-System', 'Tür-Mülleimer', 'Mülltrennung 2-fach', 'Mülltrennung 3-fach', 'Mülltrennung 4-fach+', 'Bio-/Komposteimer'];
const LIGHTING_OPTIONS = ['Unterschrankbeleuchtung', 'Arbeitsplattenbeleuchtung', 'Griffmulden-LED', 'Sockelbeleuchtung', 'Vitrinenbeleuchtung', 'Dimmbares Licht', 'Warmweiß (3000K)', 'Neutralweiß (4000K)'];
const SINK_BRANDS = ['Blanco', 'Franke', 'Schock', 'Villeroy & Boch', 'Hansgrohe', 'Grohe', 'Dornbracht', 'Quooker', 'Andere'];

export function SinkForm({ data, onChange }: SinkFormProps) {
  const toggleLighting = (item: string) => {
    const current = data.lighting || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    onChange({ lighting: updated });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Spüle, Armatur & mehr</h2>
        <p className="text-muted-foreground mt-2">Details zu Spüle, Wasserhahn, Müllsystem und Beleuchtung</p>
      </div>

      {/* Spülenmaterial */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Droplets className="w-5 h-5 text-primary" />Spülenmaterial</h3>
        <p className="text-sm text-muted-foreground">Aus welchem Material soll die Spüle sein?</p>
        <div className="flex flex-wrap gap-2">
          {SINK_MATERIALS.map(material => (
            <button key={material} onClick={() => onChange({ sink: material })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.sink === material ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {material}
            </button>
          ))}
        </div>
      </div>

      {/* Spülenfarbe */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Spülenfarbe</h3>
        <p className="text-sm text-muted-foreground">In welcher Farbe soll die Spüle sein?</p>
        <div className="flex flex-wrap gap-2">
          {SINK_COLORS.map(color => (
            <button key={color} onClick={() => toggleLighting(`Spülenfarbe:${color}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.lighting?.includes(`Spülenfarbe:${color}`) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Einbauart */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Einbauart der Spüle</h3>
        <RadioGroup 
          value={data.lighting?.find(l => SINK_TYPES.some(t => l === `Einbau:${t}`))?.replace('Einbau:', '') || ''} 
          onValueChange={v => {
            const filtered = (data.lighting || []).filter(l => !l.startsWith('Einbau:'));
            onChange({ lighting: [...filtered, `Einbau:${v}`] });
          }}>
          <div className="grid md:grid-cols-2 gap-4">
            {SINK_TYPES.map(type => (
              <div key={type} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={type} id={`sink-${type}`} className="mt-0.5" />
                <div>
                  <Label htmlFor={`sink-${type}`} className="font-medium cursor-pointer">{type}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {type === 'Einbauspüle (Auflage)' && 'Klassisch mit sichtbarem Rand auf der Arbeitsplatte'}
                    {type === 'Unterbauspüle' && 'Von unten montiert, saubere Kante zur Arbeitsplatte'}
                    {type === 'Flächenbündig' && 'Bündig mit der Arbeitsplatte eingelassen – sehr hochwertig'}
                    {type === 'Integriert in Arbeitsplatte' && 'Spüle und Arbeitsplatte aus einem Guss'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 mt-2">
          <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Flächenbündige Spülen erfordern eine dickere Arbeitsplatte (mind. 12mm) und sind aufwendiger in der Montage.</p>
        </div>
      </div>

      {/* Beckengröße */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Beckengröße & Aufteilung</h3>
        <div className="flex flex-wrap gap-2">
          {SINK_SIZES.map(size => (
            <button key={size} onClick={() => toggleLighting(`Becken:${size}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.lighting?.includes(`Becken:${size}`) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {size}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Checkbox 
            id="restebecken" 
            checked={data.lighting?.includes('Restebecken')} 
            onCheckedChange={() => toggleLighting('Restebecken')} 
          />
          <Label htmlFor="restebecken">Kleines Restebecken</Label>
        </div>
      </div>

      {/* Hersteller Spüle */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Bevorzugte Hersteller Spüle/Armatur</h3>
        <div className="flex flex-wrap gap-2">
          {SINK_BRANDS.map(brand => (
            <button key={brand} onClick={() => toggleLighting(`Hersteller:${brand}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.lighting?.includes(`Hersteller:${brand}`) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Armatur */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Armatur / Wasserhahn - Typ</h3>
        <p className="text-sm text-muted-foreground">Welche Art von Armatur bevorzugen Sie?</p>
        <div className="flex flex-wrap gap-2">
          {FAUCET_TYPES.map(type => (
            <button key={type} onClick={() => toggleLighting(`Armatur:${type}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.lighting?.includes(`Armatur:${type}`) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {type}
            </button>
          ))}
        </div>
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 mt-2">
          <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Bei einem Fenster hinter der Spüle empfehlen wir eine Vorfenster-Armatur, die sich umlegen lässt.</p>
        </div>
      </div>

      {/* Armatur Oberfläche */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Armatur - Oberfläche/Farbe</h3>
        <div className="flex flex-wrap gap-2">
          {FAUCET_FINISHES.map(finish => (
            <button key={finish} onClick={() => toggleLighting(`ArmaturFarbe:${finish}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.lighting?.includes(`ArmaturFarbe:${finish}`) ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {finish}
            </button>
          ))}
        </div>
      </div>

      {/* Zusatzfunktionen Armatur */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Zusatzfunktionen Armatur</h3>
        <p className="text-sm text-muted-foreground">Möchten Sie besondere Wasserfunktionen?</p>
        <div className="grid md:grid-cols-2 gap-3">
          {FAUCET_EXTRAS.map(extra => (
            <div key={extra} className="flex items-center gap-2">
              <Checkbox 
                id={`extra-${extra}`} 
                checked={data.lighting?.includes(`ArmaturExtra:${extra}`)} 
                onCheckedChange={() => toggleLighting(`ArmaturExtra:${extra}`)} 
              />
              <Label htmlFor={`extra-${extra}`}>{extra}</Label>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 mt-2">
          <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Kochendwasser-Armaturen (z.B. Quooker) erfordern einen speziellen Boiler unter der Spüle.</p>
        </div>
      </div>

      {/* Müllsystem */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Trash2 className="w-5 h-5 text-primary" />Müll- & Entsorgungssystem</h3>
        <p className="text-sm text-muted-foreground">Wie soll der Müll in der Küche organisiert werden?</p>
        <div className="flex flex-wrap gap-2">
          {WASTE_SYSTEMS.map(system => (
            <button key={system} onClick={() => toggleLighting(`Müll:${system}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.lighting?.includes(`Müll:${system}`) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {system}
            </button>
          ))}
        </div>
      </div>

      {/* Beleuchtung */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Lightbulb className="w-5 h-5 text-primary" />Küchenbeleuchtung</h3>
        <p className="text-sm text-muted-foreground">Welche Beleuchtungselemente sollen integriert werden?</p>
        <div className="grid md:grid-cols-2 gap-3">
          {LIGHTING_OPTIONS.map(option => (
            <div key={option} className="flex items-center gap-2">
              <Checkbox 
                id={`light-${option}`} 
                checked={data.lighting?.includes(`Licht:${option}`)} 
                onCheckedChange={() => toggleLighting(`Licht:${option}`)} 
              />
              <Label htmlFor={`light-${option}`}>{option}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Sonstige Anmerkungen */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Weitere Wünsche zu Spüle, Armatur & Beleuchtung</h3>
        <Textarea 
          value={data.lighting?.filter(l => l.startsWith('Notiz:')).map(l => l.replace('Notiz:', '')).join('\n') || ''} 
          onChange={e => {
            const filtered = (data.lighting || []).filter(l => !l.startsWith('Notiz:'));
            const notes = e.target.value.split('\n').filter(s => s.trim()).map(s => `Notiz:${s}`);
            onChange({ lighting: [...filtered, ...notes] });
          }} 
          placeholder="Weitere Wünsche oder Anmerkungen..." 
          className="kitchen-input min-h-[100px]" 
        />
      </div>
    </motion.div>
  );
}
