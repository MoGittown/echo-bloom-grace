import { KitchenPreferences, APPLIANCE_TYPES } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ChefHat, Flame, Fan, Refrigerator, Microwave, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppliancesFormProps {
  data: KitchenPreferences;
  onChange: (data: Partial<KitchenPreferences>) => void;
}

const APPLIANCE_BRANDS = ['Miele', 'Siemens', 'Bosch', 'Gaggenau', 'Neff', 'AEG', 'Bora', 'Liebherr', 'V-Zug', 'Andere'];
const FRIDGE_TYPES = ['Einbaugerät', 'Freistehend', 'Kühl-Gefrier-Kombi', 'Side-by-Side', 'French Door'];
const HOOD_TYPES = ['Wandhaube', 'Inselhaube', 'Flachschirmhaube', 'Deckenlüfter', 'Kochfeldabzug (BORA etc.)', 'Downdraft/Muldenlüfter'];

export function AppliancesForm({ data, onChange }: AppliancesFormProps) {
  const updateAppliances = (updates: Partial<typeof data.appliances>) => {
    onChange({ appliances: { ...data.appliances, ...updates } });
  };

  const toggleOther = (item: string) => {
    const current = data.appliances.other || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    updateAppliances({ other: updated });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Elektrogeräte</h2>
        <p className="text-muted-foreground mt-2">Welche Geräte sollen in Ihrer Küche verbaut werden?</p>
      </div>

      {/* Kochfeld */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Flame className="w-5 h-5 text-primary" />Kochfeld</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Art des Kochfelds</Label>
            <Select value={data.appliances.cooktop} onValueChange={v => updateAppliances({ cooktop: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>{APPLIANCE_TYPES.cooktop.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Größe / Anzahl Kochzonen</Label>
            <RadioGroup value={data.appliances.other?.find(i => ['4-Zonen', '5-Zonen', '6-Zonen'].includes(i)) || '4-Zonen'} 
              onValueChange={v => {
                const filtered = (data.appliances.other || []).filter(i => !['4-Zonen', '5-Zonen', '6-Zonen'].includes(i));
                updateAppliances({ other: [...filtered, v] });
              }}>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><RadioGroupItem value="4-Zonen" id="z4" /><Label htmlFor="z4">4 Zonen (60cm)</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="5-Zonen" id="z5" /><Label htmlFor="z5">5 Zonen (80cm)</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="6-Zonen" id="z6" /><Label htmlFor="z6">6 Zonen (90cm)</Label></div>
              </div>
            </RadioGroup>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox id="flex" checked={data.appliances.other?.includes('Flex-Zone')} onCheckedChange={() => toggleOther('Flex-Zone')} />
            <Label htmlFor="flex">Flex-Zone / Bräterfunktion</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="teppan" checked={data.appliances.other?.includes('Teppan Yaki')} onCheckedChange={() => toggleOther('Teppan Yaki')} />
            <Label htmlFor="teppan">Teppan Yaki</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="wok" checked={data.appliances.other?.includes('Wok-Mulde')} onCheckedChange={() => toggleOther('Wok-Mulde')} />
            <Label htmlFor="wok">Wok-Mulde</Label>
          </div>
        </div>
      </div>

      {/* Dunstabzug */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Fan className="w-5 h-5 text-primary" />Dunstabzug</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Art des Dunstabzugs</Label>
            <Select value={data.appliances.hood} onValueChange={v => updateAppliances({ hood: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>{HOOD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Betriebsart</Label>
            <RadioGroup value={data.appliances.other?.find(i => ['Abluft', 'Umluft', 'Beides möglich'].includes(i)) || ''} 
              onValueChange={v => {
                const filtered = (data.appliances.other || []).filter(i => !['Abluft', 'Umluft', 'Beides möglich'].includes(i));
                updateAppliances({ other: [...filtered, v] });
              }}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2"><RadioGroupItem value="Abluft" id="abluft" /><Label htmlFor="abluft">Abluft (nach außen)</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="Umluft" id="umluft" /><Label htmlFor="umluft">Umluft (mit Filter)</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="Beides möglich" id="beides" /><Label htmlFor="beides">Beides möglich</Label></div>
              </div>
            </RadioGroup>
          </div>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Kochfeldabzüge (z.B. BORA) werden direkt ins Kochfeld integriert und benötigen einen Abluftkanal nach unten.</p>
        </div>
      </div>

      {/* Backofen */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary" />Backofen</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Art des Backofens</Label>
            <Select value={data.appliances.oven} onValueChange={v => updateAppliances({ oven: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>{APPLIANCE_TYPES.oven.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Einbauhöhe</Label>
            <RadioGroup value={data.appliances.other?.includes('Backofen-Hocheinbau') ? 'Backofen-Hocheinbau' : 'Backofen-Normal'} 
              onValueChange={v => {
                const filtered = (data.appliances.other || []).filter(i => !['Backofen-Hocheinbau', 'Backofen-Normal'].includes(i));
                updateAppliances({ other: [...filtered, v] });
              }}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2"><RadioGroupItem value="Backofen-Normal" id="bo-normal" /><Label htmlFor="bo-normal">Unter der Arbeitsplatte</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="Backofen-Hocheinbau" id="bo-hoch" /><Label htmlFor="bo-hoch">Hocheinbau (rückenschonend)</Label></div>
              </div>
            </RadioGroup>
          </div>
        </div>
        <div className="space-y-3 pt-2">
          <Label className="font-medium">Backofen-Features</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="pyro" checked={data.appliances.other?.includes('Pyrolyse')} onCheckedChange={() => toggleOther('Pyrolyse')} />
              <Label htmlFor="pyro">Pyrolyse (Selbstreinigung)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="dampf" checked={data.appliances.other?.includes('Dampfgarer')} onCheckedChange={() => toggleOther('Dampfgarer')} />
              <Label htmlFor="dampf">Dampfgarer-Funktion</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="kombi" checked={data.appliances.other?.includes('Kombi-Dampfgarer')} onCheckedChange={() => toggleOther('Kombi-Dampfgarer')} />
              <Label htmlFor="kombi">Kombi-Dampfgarer</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="zweiter" checked={data.appliances.other?.includes('Zweiter Backofen')} onCheckedChange={() => toggleOther('Zweiter Backofen')} />
              <Label htmlFor="zweiter">Zweiter Backofen</Label>
            </div>
          </div>
        </div>
        <div className="space-y-3 pt-2">
          <Label className="font-medium">Zusatzgeräte (Einbau)</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="mw" checked={data.appliances.microwave} onCheckedChange={c => updateAppliances({ microwave: !!c })} />
              <Label htmlFor="mw">Mikrowelle</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="warmhalte" checked={data.appliances.other?.includes('Wärmeschublade')} onCheckedChange={() => toggleOther('Wärmeschublade')} />
              <Label htmlFor="warmhalte">Wärmeschublade</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="vakuum" checked={data.appliances.other?.includes('Vakuumierschublade')} onCheckedChange={() => toggleOther('Vakuumierschublade')} />
              <Label htmlFor="vakuum">Vakuumierschublade</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="kaffeevoll" checked={data.appliances.other?.includes('Kaffeevollautomat')} onCheckedChange={() => toggleOther('Kaffeevollautomat')} />
              <Label htmlFor="kaffeevoll">Einbau-Kaffeevollautomat</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Kühlschrank */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Refrigerator className="w-5 h-5 text-primary" />Kühlen & Gefrieren</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Art des Kühlschranks</Label>
            <Select value={data.appliances.fridge} onValueChange={v => updateAppliances({ fridge: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>{FRIDGE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label>Zusätzliche Geräte</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id="gefrier" checked={data.appliances.other?.includes('Gefrierschrank separat')} onCheckedChange={() => toggleOther('Gefrierschrank separat')} />
                <Label htmlFor="gefrier">Separater Gefrierschrank</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="wein" checked={data.appliances.other?.includes('Weinkühlschrank')} onCheckedChange={() => toggleOther('Weinkühlschrank')} />
                <Label htmlFor="wein">Weinkühlschrank</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Geschirrspüler */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Microwave className="w-5 h-5 text-primary" />Geschirrspüler</h3>
        <div className="flex items-center gap-2 mb-4">
          <Checkbox id="dw" checked={data.appliances.dishwasher} onCheckedChange={c => updateAppliances({ dishwasher: !!c })} />
          <Label htmlFor="dw" className="font-medium">Geschirrspüler gewünscht</Label>
        </div>
        {data.appliances.dishwasher && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Einbauhöhe</Label>
              <RadioGroup value={data.appliances.other?.includes('GS-Hocheinbau') ? 'GS-Hocheinbau' : 'GS-Normal'} 
                onValueChange={v => {
                  const filtered = (data.appliances.other || []).filter(i => !['GS-Hocheinbau', 'GS-Normal'].includes(i));
                  updateAppliances({ other: [...filtered, v] });
                }}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2"><RadioGroupItem value="GS-Normal" id="gs-normal" /><Label htmlFor="gs-normal">Normal (unter AP)</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="GS-Hocheinbau" id="gs-hoch" /><Label htmlFor="gs-hoch">Hocheinbau</Label></div>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Breite</Label>
              <RadioGroup value={data.appliances.other?.includes('GS-45cm') ? 'GS-45cm' : 'GS-60cm'} 
                onValueChange={v => {
                  const filtered = (data.appliances.other || []).filter(i => !['GS-45cm', 'GS-60cm'].includes(i));
                  updateAppliances({ other: [...filtered, v] });
                }}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2"><RadioGroupItem value="GS-60cm" id="gs-60" /><Label htmlFor="gs-60">60 cm (Standard)</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="GS-45cm" id="gs-45" /><Label htmlFor="gs-45">45 cm (schmal)</Label></div>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Integrationsart</Label>
              <RadioGroup value={data.appliances.other?.find(i => ['GS-Vollintegriert', 'GS-Teilintegriert'].includes(i)) || 'GS-Vollintegriert'} 
                onValueChange={v => {
                  const filtered = (data.appliances.other || []).filter(i => !['GS-Vollintegriert', 'GS-Teilintegriert'].includes(i));
                  updateAppliances({ other: [...filtered, v] });
                }}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2"><RadioGroupItem value="GS-Vollintegriert" id="gs-voll" /><Label htmlFor="gs-voll">Vollintegriert</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="GS-Teilintegriert" id="gs-teil" /><Label htmlFor="gs-teil">Teilintegriert</Label></div>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 pt-2">
          <Checkbox id="dw2" checked={data.appliances.other?.includes('Zweiter Geschirrspüler')} onCheckedChange={() => toggleOther('Zweiter Geschirrspüler')} />
          <Label htmlFor="dw2">Zweiter Geschirrspüler gewünscht</Label>
        </div>
      </div>

      {/* Gerätemarken */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Bevorzugte Gerätemarken</h3>
        <p className="text-sm text-muted-foreground">Haben Sie Präferenzen bei Elektrogeräte-Herstellern?</p>
        <div className="flex flex-wrap gap-2">
          {APPLIANCE_BRANDS.map(brand => (
            <button key={brand} onClick={() => toggleOther(`Marke:${brand}`)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.appliances.other?.includes(`Marke:${brand}`) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Sonstige Anmerkungen */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Sonstige Wünsche zu Elektrogeräten</h3>
        <Textarea 
          value={data.appliances.other?.filter(i => i.startsWith('Notiz:')).map(i => i.replace('Notiz:', '')).join('\n') || ''} 
          onChange={e => {
            const filtered = (data.appliances.other || []).filter(i => !i.startsWith('Notiz:'));
            const notes = e.target.value.split('\n').filter(s => s.trim()).map(s => `Notiz:${s}`);
            updateAppliances({ other: [...filtered, ...notes] });
          }} 
          placeholder="Weitere Wünsche oder Anmerkungen zu Geräten..." 
          className="kitchen-input min-h-[100px]" 
        />
      </div>
    </motion.div>
  );
}
