import { KitchenPreferences } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Droplets, Lightbulb, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';

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
        <h3 className="font-semibold flex items-center gap-2">
          <Droplets className="w-5 h-5 text-primary" />
          Spülenmaterial
          <InfoTooltip 
            description="Das Material beeinflusst Optik, Haptik, Pflegeaufwand und Kratzfestigkeit."
            recommendation="Silgranit ist robust und pflegeleicht. Keramik ist elegant aber empfindlicher. Edelstahl ist zeitlos und hygienisch."
          />
        </h3>
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
        <h3 className="font-semibold flex items-center gap-2">
          Spülenfarbe
          <InfoTooltip description="Die Farbe sollte zur Arbeitsplatte und den Fronten passen. Dunkle Farben zeigen weniger Kalkflecken." />
        </h3>
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
        <h3 className="font-semibold flex items-center gap-2">
          Einbauart der Spüle
          <InfoTooltip 
            description="Die Einbauart bestimmt Optik und Reinigungsfreundlichkeit. Flächenbündige Spülen sind optisch hochwertig aber teurer in der Montage."
          />
        </h3>
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
      </div>

      {/* Beckengröße */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          Beckengröße & Aufteilung
          <InfoTooltip 
            description="Die Beckenwahl hängt vom Nutzungsverhalten ab. Große Einzelbecken sind praktisch für große Töpfe. Doppelbecken ermöglichen Trennung von Abwasch und Abspülen."
            recommendation="1,5 Becken ist ein guter Kompromiss aus Flexibilität und Platz."
          />
        </h3>
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
          <Label htmlFor="restebecken" className="flex items-center gap-1">
            Kleines Restebecken
            <InfoTooltip description="Kleines Zusatzbecken für Gemüseabfälle oder zum kurzen Abspülen." />
          </Label>
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
        <h3 className="font-semibold flex items-center gap-2">
          Armatur / Wasserhahn - Typ
          <InfoTooltip 
            description="Die Armatur ist täglich im Einsatz. Achten Sie auf Bedienkomfort und Funktionalität."
            recommendation="Ausziehbare Brausen sind sehr praktisch. Bei einem Fenster hinter der Spüle empfehlen wir eine Vorfenster-Armatur."
          />
        </h3>
        <p className="text-sm text-muted-foreground">Welche Art von Armatur bevorzugen Sie?</p>
        <div className="flex flex-wrap gap-2">
          {FAUCET_TYPES.map(type => (
            <button key={type} onClick={() => toggleLighting(`Armatur:${type}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.lighting?.includes(`Armatur:${type}`) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Armatur Oberfläche */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          Armatur - Oberfläche/Farbe
          <InfoTooltip description="Die Oberfläche sollte zur Spüle und dem Küchendesign passen. Matte Oberflächen zeigen weniger Fingerabdrücke." />
        </h3>
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
        <h3 className="font-semibold flex items-center gap-2">
          Zusatzfunktionen Armatur
          <InfoTooltip description="Diese Funktionen erhöhen den Komfort, benötigen aber teilweise zusätzliche Geräte unter der Spüle." />
        </h3>
        <p className="text-sm text-muted-foreground">Möchten Sie besondere Wasserfunktionen?</p>
        <div className="grid md:grid-cols-2 gap-3">
          {FAUCET_EXTRAS.map(extra => (
            <div key={extra} className="flex items-center gap-2">
              <Checkbox 
                id={`extra-${extra}`} 
                checked={data.lighting?.includes(`ArmaturExtra:${extra}`)} 
                onCheckedChange={() => toggleLighting(`ArmaturExtra:${extra}`)} 
              />
              <Label htmlFor={`extra-${extra}`} className="flex items-center gap-1">
                {extra}
                {extra === 'Kochendwasser (Quooker etc.)' && (
                  <InfoTooltip description="Liefert sofort 100°C heißes Wasser. Praktisch für Tee, Pasta etc. Benötigt einen Boiler unter der Spüle." />
                )}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Müllsystem */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-primary" />
          Müll- & Entsorgungssystem
          <InfoTooltip 
            description="Ein gutes Müllsystem erleichtert die Trennung und hält die Küche sauber."
            recommendation="Auszug-Systeme im Unterschrank sind hygienisch und praktisch. 3-fach Trennung für Restmüll, Papier und Verpackungen."
          />
        </h3>
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
        <h3 className="font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Küchenbeleuchtung
          <InfoTooltip 
            description="Gute Beleuchtung ist essentiell für sicheres Arbeiten und Atmosphäre."
            recommendation="Unterschrankbeleuchtung ist ein Muss. Warmweiß (3000K) für gemütliche Atmosphäre, Neutralweiß (4000K) für bessere Farbwiedergabe."
          />
        </h3>
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
