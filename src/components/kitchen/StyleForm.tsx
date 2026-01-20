import { useState } from 'react';
import { KitchenPreferences, KITCHEN_STYLES, KITCHEN_COLORS, KITCHEN_MATERIALS, KITCHEN_MANUFACTURERS, COUNTERTOP_MATERIALS, STORAGE_OPTIONS } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Palette, Heart, Star, Euro, Package, Layers, User, ChefHat, Hand, Plus, X, Users, Factory } from 'lucide-react';
import { motion } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';
import { useBranding } from '@/hooks/useBranding';

interface StyleFormProps {
  data: KitchenPreferences;
  onChange: (data: Partial<KitchenPreferences>) => void;
}

const FRONT_SURFACES = ['Matt', 'Hochglanz', 'Lack', 'Echtholz', 'Furnier', 'Folie', 'Anti-Fingerprint'];
const COUNTERTOP_THICKNESS = ['12mm (dünn/modern)', '20mm (Standard)', '30mm', '40mm+'];
const BACKSPLASH_MATERIALS = ['Glas', 'Fliesen', 'Nischenpaneel', 'Naturstein', 'Arbeitsplatte fortführen', 'Edelstahl'];

const GRIP_TYPES = [
  { value: 'grifflos', label: 'Grifflos', description: 'Öffnung durch Push-to-Open oder Griffmulde an der Oberkante. Sehr modern und puristisch.' },
  { value: 'griffmulde', label: 'Griffmulde', description: 'Eingefräste Mulde an der Oberkante der Front. Dezent und praktisch.' },
  { value: 'buegelgriff', label: 'Bügelgriff', description: 'Klassischer gebogener Griff. Ergonomisch und zeitlos.' },
  { value: 'stangengriff', label: 'Stangengriff', description: 'Lange, durchgehende Stange. Modern und gut greifbar.' },
];

const COOKING_FREQUENCY = [
  { value: 'daily', label: 'Täglich', description: 'Sie kochen jeden Tag frisch und brauchen hochwertige Geräte und viel Stauraum.' },
  { value: 'mehrmals', label: 'Mehrmals pro Woche', description: 'Regelmäßiges Kochen mit gelegentlichem Bestellen oder Fertiggerichten.' },
  { value: 'gelegentlich', label: 'Gelegentlich', description: 'Sie kochen am Wochenende oder bei besonderen Anlässen.' },
  { value: 'selten', label: 'Selten', description: 'Die Küche wird hauptsächlich für einfache Mahlzeiten genutzt.' },
];

const HOUSEHOLD_SIZE = [
  { value: '1', label: '1 Person', description: 'Single-Haushalt – kompakte Lösungen oft ausreichend.' },
  { value: '2', label: '2 Personen', description: 'Paar-Haushalt – Standard-Geräte meist passend.' },
  { value: '3-4', label: '3–4 Personen', description: 'Familie – mehr Stauraum und größere Geräte empfohlen.' },
  { value: '5+', label: '5+ Personen', description: 'Großfamilie – großzügige Küche mit viel Kapazität nötig.' },
];

const STYLE_TOOLTIPS: Record<string, { description: string; recommendation?: string }> = {
  'Modern': { description: 'Klare Linien, grifflose Fronten, oft in Weiß, Grau oder Schwarz. Hochglanz oder samtmatt.', recommendation: 'Ideal mit Induktionskochfeld und integriertem Dunstabzug.' },
  'Klassisch': { description: 'Zeitlose Eleganz mit profilierten Fronten, warmen Farben und hochwertigen Materialien.' },
  'Landhausstil': { description: 'Gemütlich mit Holzfronten, Kassettentüren, warmen Farben. Oft mit offenen Regalen.', recommendation: 'Passt gut zu Keramikspülen und Messing-Armaturen.' },
  'Skandinavisch': { description: 'Hell, freundlich, funktional. Helles Holz, Weiß, natürliche Materialien.' },
  'Industrial': { description: 'Rau und urban mit Beton, Metall, dunklen Farben und offenen Regalen.' },
  'Minimalistisch': { description: 'Reduktion aufs Wesentliche. Grifflos, versteckter Stauraum, ruhige Farbpalette.' },
  'Mediterran': { description: 'Warme Erdtöne, Terrakotta, rustikales Holz. Südländisches Flair.' },
};

// Berechne optimale Arbeitshöhe nach der Ellbogen-Methode
const calculateWorkHeight = (bodyHeight: number): number => {
  // Ellbogenhöhe ist ca. 60% der Körpergröße, Arbeitshöhe 10-15 cm darunter
  const elbowHeight = bodyHeight * 0.6;
  return Math.round(elbowHeight - 12);
};

export function StyleForm({ data, onChange }: StyleFormProps) {
  const [newHeight, setNewHeight] = useState('');
  const [customManufacturer, setCustomManufacturer] = useState('');
  const { branding } = useBranding();
  
  const toggle = (arr: string[], item: string) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const toggleExtra = (item: string) => {
    const current = data.mustHaves || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    onChange({ mustHaves: updated });
  };

  const addUserHeight = () => {
    const height = parseInt(newHeight);
    if (height >= 140 && height <= 220) {
      const updated = [...(data.userHeights || []), height];
      onChange({ userHeights: updated });
      setNewHeight('');
    }
  };

  const removeUserHeight = (index: number) => {
    const updated = (data.userHeights || []).filter((_, i) => i !== index);
    onChange({ userHeights: updated });
  };

  const addCustomManufacturer = () => {
    const trimmed = customManufacturer.trim();
    if (trimmed && !data.manufacturers.includes(trimmed)) {
      onChange({ manufacturers: [...data.manufacturers, trimmed] });
      setCustomManufacturer('');
    }
  };

  const removeManufacturer = (manufacturer: string) => {
    onChange({ manufacturers: data.manufacturers.filter(m => m !== manufacturer) });
  };

  // Berechne empfohlene Arbeitshöhe basierend auf den Nutzergrößen
  const recommendedWorkHeight = data.userHeights && data.userHeights.length > 0
    ? Math.round(data.userHeights.reduce((sum, h) => sum + calculateWorkHeight(h), 0) / data.userHeights.length)
    : null;

  const Chip = ({ items, field, accent }: { items: string[]; field: keyof KitchenPreferences; accent?: boolean }) => (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const tooltip = STYLE_TOOLTIPS[item];
        return (
          <div key={item} className="flex items-center gap-1">
            <button 
              onClick={() => onChange({ [field]: toggle((data[field] as string[]), item) })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${(data[field] as string[]).includes(item) ? accent ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {item}
            </button>
            {tooltip && (
              <InfoTooltip 
                title={item} 
                description={tooltip.description} 
                recommendation={tooltip.recommendation} 
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Stil & Design</h2>
        <p className="text-muted-foreground mt-2">Welchen Look soll Ihre Traumküche haben?</p>
      </div>

      {/* NEU: Ergonomie - Körpergröße */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Körpergröße der Hauptnutzer
          <InfoTooltip 
            description="Die Körpergröße bestimmt die optimale Arbeitshöhe Ihrer Küche. Die ideale Höhe liegt etwa 10-15 cm unter der Ellbogenhöhe."
            recommendation="Bei unterschiedlich großen Nutzern empfehlen wir einen Kompromiss oder höhenverstellbare Elemente."
          />
        </h3>
        <p className="text-sm text-muted-foreground">Für die Berechnung der optimalen Arbeitshöhe</p>
        
        <div className="flex flex-wrap gap-2 items-center">
          {(data.userHeights || []).map((height, index) => (
            <div key={index} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm">
              <span>{height} cm</span>
              <button onClick={() => removeUserHeight(index)} className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={newHeight}
              onChange={(e) => setNewHeight(e.target.value)}
              placeholder="z.B. 175"
              className="kitchen-input w-24"
              min={140}
              max={220}
              onKeyDown={(e) => e.key === 'Enter' && addUserHeight()}
            />
            <span className="text-sm text-muted-foreground">cm</span>
            <Button onClick={addUserHeight} size="sm" variant="outline" className="gap-1">
              <Plus className="w-4 h-4" /> Hinzufügen
            </Button>
          </div>
        </div>

        {recommendedWorkHeight && (
          <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm font-medium text-accent">
              💡 Empfohlene Arbeitshöhe: <span className="text-lg">{recommendedWorkHeight} cm</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Standard ist 92 cm. Ihre individuelle Höhe basiert auf der Ellbogen-Methode.)
            </p>
          </div>
        )}
      </div>

      {/* NEU: Kochverhalten */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary" />
          Wie oft kochen Sie?
          <InfoTooltip 
            description="Ihr Kochverhalten beeinflusst die Empfehlungen für Gerätequalität, Stauraum und Arbeitsflächengröße."
          />
        </h3>
        <p className="text-sm text-muted-foreground">Dies beeinflusst die Empfehlung für Geräte und Stauraum</p>
        
        <RadioGroup 
          value={data.cookingFrequency || ''} 
          onValueChange={(v) => onChange({ cookingFrequency: v })}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            {COOKING_FREQUENCY.map((option) => (
              <div key={option.value} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <RadioGroupItem value={option.value} id={`cook-${option.value}`} className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor={`cook-${option.value}`} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* NEU: Haushaltsgröße */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Für wie viele Personen wird gekocht?
          <InfoTooltip 
            description="Die Haushaltsgröße beeinflusst die Dimensionierung von Kühlschrank, Geschirrspüler und Stauraum."
            recommendation="Ab 4 Personen empfehlen wir einen 60cm Geschirrspüler und einen größeren Kühlschrank."
          />
        </h3>
        <p className="text-sm text-muted-foreground">Beeinflusst die Geräte- und Stauraumempfehlung</p>
        
        <RadioGroup 
          value={data.householdSize || ''} 
          onValueChange={(v) => onChange({ householdSize: v })}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            {HOUSEHOLD_SIZE.map((option) => (
              <div key={option.value} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <RadioGroupItem value={option.value} id={`household-${option.value}`} className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor={`household-${option.value}`} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* NEU: Griff-Präferenz */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Hand className="w-5 h-5 text-primary" />
          Griff-Präferenz
          <InfoTooltip 
            description="Der Grifftyp prägt das Erscheinungsbild Ihrer Küche maßgeblich und beeinflusst die Handhabung im Alltag."
            recommendation="Grifflose Küchen wirken modern, erfordern aber saubere Fronten. Bügelgriffe sind zeitlos und praktisch."
          />
        </h3>
        <p className="text-sm text-muted-foreground">Wie möchten Sie Ihre Schränke öffnen?</p>
        
        <RadioGroup 
          value={data.gripType || ''} 
          onValueChange={(v) => onChange({ gripType: v })}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            {GRIP_TYPES.map((option) => (
              <div key={option.value} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <RadioGroupItem value={option.value} id={`grip-${option.value}`} className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor={`grip-${option.value}`} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Küchenstil
          <InfoTooltip 
            description="Der Küchenstil bestimmt das Gesamtbild. Unterschiedliche Stile haben verschiedene Materialien, Farben und Formen."
          />
        </h3>
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

      {/* Frontenoberfläche */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Oberfläche der Fronten
          <InfoTooltip 
            description="Die Oberfläche beeinflusst Optik, Haptik und Pflegeaufwand."
            recommendation="Anti-Fingerprint ist ideal für dunkle, matte Fronten."
          />
        </h3>
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

      {/* Arbeitsplattenstärke */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          Arbeitsplatte - Stärke
          <InfoTooltip 
            description="Dünnere Platten (12mm) wirken modern und leicht. Dickere Platten (40mm+) wirken massiv und hochwertig."
            recommendation="12mm für modernen Look, 20mm als solider Standard."
          />
        </h3>
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

      {/* Nischenrückwand */}
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

      {branding.showManufacturerField && (
        <div className="kitchen-card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Factory className="w-5 h-5 text-primary" />
            Bevorzugte Küchenhersteller
            <InfoTooltip 
              description="Falls Sie bereits bestimmte Küchenmarken bevorzugen, können wir das bei der Planung berücksichtigen."
              recommendation="Dies ist optional – viele Kunden entscheiden sich erst nach der Beratung für einen Hersteller."
            />
          </h3>
          <p className="text-sm text-muted-foreground">Haben Sie Präferenzen bei Küchenmarken? (optional)</p>
          
          {/* Selected manufacturers */}
          {data.manufacturers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {data.manufacturers.map((manufacturer) => (
                <div key={manufacturer} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm">
                  <span>{manufacturer}</span>
                  <button onClick={() => removeManufacturer(manufacturer)} className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Studio custom manufacturers (from branding) */}
          {branding.customManufacturers && branding.customManufacturers.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground font-medium mt-2">Unsere Empfehlungen:</p>
              <div className="flex flex-wrap gap-2">
                {branding.customManufacturers.filter(m => !data.manufacturers.includes(m)).map(manufacturer => (
                  <button 
                    key={manufacturer}
                    onClick={() => onChange({ manufacturers: [...data.manufacturers, manufacturer] })}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-accent/20 text-accent-foreground hover:bg-accent/30 border border-accent/30"
                  >
                    {manufacturer}
                  </button>
                ))}
              </div>
            </>
          )}
          
          {/* Standard manufacturer chips */}
          <p className="text-xs text-muted-foreground font-medium mt-2">Weitere Hersteller:</p>
          <div className="flex flex-wrap gap-2">
            {KITCHEN_MANUFACTURERS.filter(m => m !== 'Andere' && !data.manufacturers.includes(m)).map(manufacturer => (
              <button 
                key={manufacturer}
                onClick={() => onChange({ manufacturers: [...data.manufacturers, manufacturer] })}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-muted text-muted-foreground hover:bg-muted/80"
              >
                {manufacturer}
              </button>
            ))}
          </div>
          
          {/* Custom manufacturer input */}
          <div className="flex items-center gap-2 pt-2 border-t border-border mt-4">
            <Input
              type="text"
              value={customManufacturer}
              onChange={(e) => setCustomManufacturer(e.target.value)}
              placeholder="Anderen Hersteller eingeben..."
              className="kitchen-input flex-1"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomManufacturer())}
            />
            <Button onClick={addCustomManufacturer} size="sm" variant="outline" className="gap-1" disabled={!customManufacturer.trim()}>
              <Plus className="w-4 h-4" /> Hinzufügen
            </Button>
          </div>
        </div>
      )}

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
