import { KitchenPreferences } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Droplets, Lightbulb, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface SinkFormProps {
  data: KitchenPreferences;
  onChange: (data: Partial<KitchenPreferences>) => void;
}

const SINK_MATERIALS = ['Edelstahl', 'Granit/Silgranit', 'Keramik', 'Quarzkomposit', 'Kupfer', 'Beton'];
const SINK_TYPES = ['Einbauspüle', 'Unterbauspüle', 'Flächenbündig', 'Aufsatzspüle'];
const SINK_SIZES = ['Einzelbecken', 'Doppelbecken', '1,5 Becken', 'XL-Becken'];
const FAUCET_TYPES = ['Einhebelmischer', 'Zweigriff-Armatur', 'Sensortechnik', 'Vorfenster-Armatur', 'Quooker/Heißwasser'];
const LIGHTING_OPTIONS = ['Unterschrankbeleuchtung', 'Arbeitsplattenbeleuchtung', 'Griffmulden-LED', 'Sockelbeleuchtung', 'Vitrinenbeleuchtung', 'Dimmbares Licht', 'Warmweiß (3000K)', 'Neutralweiß (4000K)'];

export function SinkForm({ data, onChange }: SinkFormProps) {
  const toggleLighting = (item: string) => {
    const current = data.lighting || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    onChange({ lighting: updated });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Spüle & Beleuchtung</h2>
        <p className="text-muted-foreground mt-2">Details zu Spüle, Armatur und Küchenbeleuchtung</p>
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

      {/* Einbauart */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Einbauart der Spüle</h3>
        <RadioGroup 
          value={data.lighting?.find(l => SINK_TYPES.includes(l)) || ''} 
          onValueChange={v => {
            const filtered = (data.lighting || []).filter(l => !SINK_TYPES.includes(l));
            onChange({ lighting: [...filtered, v] });
          }}>
          <div className="grid md:grid-cols-2 gap-4">
            {SINK_TYPES.map(type => (
              <div key={type} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={type} id={`sink-${type}`} className="mt-0.5" />
                <div>
                  <Label htmlFor={`sink-${type}`} className="font-medium cursor-pointer">{type}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {type === 'Einbauspüle' && 'Klassisch mit sichtbarem Rand auf der Arbeitsplatte'}
                    {type === 'Unterbauspüle' && 'Von unten montiert, saubere Kante zur Arbeitsplatte'}
                    {type === 'Flächenbündig' && 'Bündig mit der Arbeitsplatte eingelassen – sehr hochwertig'}
                    {type === 'Aufsatzspüle' && 'Sitzt auf der Arbeitsplatte auf'}
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
        <RadioGroup 
          value={data.lighting?.find(l => SINK_SIZES.includes(l)) || ''} 
          onValueChange={v => {
            const filtered = (data.lighting || []).filter(l => !SINK_SIZES.includes(l));
            onChange({ lighting: [...filtered, v] });
          }}>
          <div className="flex flex-wrap gap-4">
            {SINK_SIZES.map(size => (
              <div key={size} className="flex items-center gap-2">
                <RadioGroupItem value={size} id={`size-${size}`} />
                <Label htmlFor={`size-${size}`}>{size}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="abtropf" 
              checked={data.lighting?.includes('Abtropffläche')} 
              onCheckedChange={() => toggleLighting('Abtropffläche')} 
            />
            <Label htmlFor="abtropf">Abtropffläche gewünscht</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox 
              id="restebecken" 
              checked={data.lighting?.includes('Restebecken')} 
              onCheckedChange={() => toggleLighting('Restebecken')} 
            />
            <Label htmlFor="restebecken">Kleines Restebecken</Label>
          </div>
        </div>
      </div>

      {/* Armatur */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Armatur / Wasserhahn</h3>
        <p className="text-sm text-muted-foreground">Welche Art von Armatur bevorzugen Sie?</p>
        <div className="flex flex-wrap gap-2">
          {FAUCET_TYPES.map(type => (
            <button key={type} onClick={() => {
              const current = data.lighting || [];
              const filtered = current.filter(l => !l.startsWith('Armatur:'));
              onChange({ lighting: [...filtered, `Armatur:${type}`] });
            }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.lighting?.includes(`Armatur:${type}`) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {type}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="ausziehbar" 
              checked={data.lighting?.includes('Armatur:Ausziehbar')} 
              onCheckedChange={() => toggleLighting('Armatur:Ausziehbar')} 
            />
            <Label htmlFor="ausziehbar">Ausziehbare Brause</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox 
              id="schwenkbar" 
              checked={data.lighting?.includes('Armatur:Schwenkbar')} 
              onCheckedChange={() => toggleLighting('Armatur:Schwenkbar')} 
            />
            <Label htmlFor="schwenkbar">Schwenkauslauf</Label>
          </div>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 mt-2">
          <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Bei einem Fenster hinter der Spüle empfehlen wir eine Vorfenster-Armatur, die sich umlegen lässt.</p>
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
        <h3 className="font-semibold">Weitere Wünsche zu Spüle & Beleuchtung</h3>
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
