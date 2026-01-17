import { KitchenPreferences, APPLIANCE_TYPES } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ChefHat, Flame, Fan, Refrigerator, Microwave } from 'lucide-react';
import { motion } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';

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
        <h3 className="font-semibold flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Kochfeld
          <InfoTooltip 
            description="Das Kochfeld ist das Herzstück der Küche. Die Wahl beeinflusst Kochgeschwindigkeit, Sicherheit und Energieverbrauch."
            recommendation="Induktion ist schnell, sicher und energieeffizient. Gas bietet präzise Temperaturkontrolle für ambitionierte Köche."
          />
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Art des Kochfelds
              <InfoTooltip 
                description="Induktion erhitzt nur den Topfboden (schnell, sicher, effizient). Ceran erhitzt die Glasplatte (günstig, alle Töpfe nutzbar). Gas bietet direktes Arbeiten mit Flamme."
              />
            </Label>
            <Select value={data.appliances.cooktop} onValueChange={v => updateAppliances({ cooktop: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>{APPLIANCE_TYPES.cooktop.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Kochfeld-Größe
              <InfoTooltip 
                description="60 cm ist Standard für 4 Kochzonen. 80 cm bietet 5 Zonen oder mehr Abstand. 90 cm für intensive Nutzung mit 5-6 Zonen."
                recommendation="Für Familien ab 4 Personen empfehlen wir 80 oder 90 cm."
              />
            </Label>
            <RadioGroup value={data.appliances.other?.find(i => ['KF-60cm', 'KF-80cm', 'KF-90cm'].includes(i)) || ''} 
              onValueChange={v => {
                const filtered = (data.appliances.other || []).filter(i => !['KF-60cm', 'KF-80cm', 'KF-90cm'].includes(i));
                updateAppliances({ other: [...filtered, v] });
              }}>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><RadioGroupItem value="KF-60cm" id="kf60" /><Label htmlFor="kf60">60 cm</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="KF-80cm" id="kf80" /><Label htmlFor="kf80">80 cm</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="KF-90cm" id="kf90" /><Label htmlFor="kf90">90 cm</Label></div>
              </div>
            </RadioGroup>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox id="flex" checked={data.appliances.other?.includes('Flex-Zone')} onCheckedChange={() => toggleOther('Flex-Zone')} />
            <Label htmlFor="flex" className="flex items-center gap-1">
              Flex-Zone / Bräterfunktion
              <InfoTooltip description="Verbindet zwei Kochzonen zu einer großen Fläche für Bräter, Grillplatten oder große Töpfe." />
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="teppan" checked={data.appliances.other?.includes('Teppan Yaki')} onCheckedChange={() => toggleOther('Teppan Yaki')} />
            <Label htmlFor="teppan" className="flex items-center gap-1">
              Teppan Yaki
              <InfoTooltip description="Eingebaute Edelstahl-Grillplatte für japanisches Kochen direkt am Tisch." />
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="wok" checked={data.appliances.other?.includes('Wok-Mulde')} onCheckedChange={() => toggleOther('Wok-Mulde')} />
            <Label htmlFor="wok" className="flex items-center gap-1">
              Wok-Mulde
              <InfoTooltip description="Spezielle Vertiefung für Wok-Pfannen mit hoher Hitze für asiatische Küche." />
            </Label>
          </div>
        </div>
      </div>

      {/* Dunstabzug */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Fan className="w-5 h-5 text-primary" />
          Dunstabzug
          <InfoTooltip 
            description="Der Dunstabzug entfernt Kochdämpfe, Gerüche und Fettpartikel. Die Wahl hängt von Raumgestaltung und Lüftungsmöglichkeiten ab."
            recommendation="Abluft ist effektiver als Umluft. Kochfeldabzüge (BORA) sind elegant, benötigen aber Platz im Unterschrank."
          />
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Art des Dunstabzugs
              <InfoTooltip description="Wandhauben sind klassisch und effektiv. Deckenlüfter sind dezent bei Kochinseln. Kochfeldabzüge saugen Dampf direkt am Entstehungsort ab." />
            </Label>
            <Select value={data.appliances.hood} onValueChange={v => updateAppliances({ hood: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>{HOOD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Betriebsart
              <InfoTooltip 
                description="Abluft leitet die Luft nach außen (sehr effektiv, benötigt Wanddurchbruch). Umluft filtert und gibt die Luft zurück (keine Baumaßnahmen, weniger effektiv)."
                recommendation="Abluft wenn möglich, da sie Feuchtigkeit und Gerüche komplett entfernt."
              />
            </Label>
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
      </div>

      {/* Backofen */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary" />
          Backofen
          <InfoTooltip 
            description="Der Backofen ist essentiell für Braten, Backen und Garen. Moderne Geräte bieten vielfältige Funktionen wie Dampfgaren."
          />
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Art des Backofens</Label>
            <Select value={data.appliances.oven} onValueChange={v => updateAppliances({ oven: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>{APPLIANCE_TYPES.oven.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Einbauhöhe
              <InfoTooltip 
                description="Hocheinbau (auf Augenhöhe) ist ergonomisch und rückenschonend. Unter der Arbeitsplatte ist klassisch und günstiger."
                recommendation="Hocheinbau empfehlen wir bei täglicher Nutzung für komfortables Arbeiten."
              />
            </Label>
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
              <Label htmlFor="pyro" className="flex items-center gap-1">
                Pyrolyse (Selbstreinigung)
                <InfoTooltip description="Erhitzt den Ofen auf ca. 500°C und verbrennt alle Rückstände zu Asche. Sehr komfortabel, aber energieintensiv." />
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="dampf" checked={data.appliances.other?.includes('Dampfgarer')} onCheckedChange={() => toggleOther('Dampfgarer')} />
              <Label htmlFor="dampf" className="flex items-center gap-1">
                Dampfgarer-Funktion
                <InfoTooltip description="Gart mit Dampf für besonders schonende Zubereitung. Erhält Vitamine und Nährstoffe." />
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="kombi" checked={data.appliances.other?.includes('Kombi-Dampfgarer')} onCheckedChange={() => toggleOther('Kombi-Dampfgarer')} />
              <Label htmlFor="kombi" className="flex items-center gap-1">
                Kombi-Dampfgarer
                <InfoTooltip description="Kombiniert Dampf mit Heißluft für perfekte Ergebnisse bei Braten und Brot." />
              </Label>
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
              <Label htmlFor="warmhalte" className="flex items-center gap-1">
                Wärmeschublade
                <InfoTooltip description="Hält Speisen warm, vorgewärmte Teller oder lässt Teig gehen. Praktisch bei mehrgängigen Menüs." />
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="vakuum" checked={data.appliances.other?.includes('Vakuumierschublade')} onCheckedChange={() => toggleOther('Vakuumierschublade')} />
              <Label htmlFor="vakuum" className="flex items-center gap-1">
                Vakuumierschublade
                <InfoTooltip description="Vakuumiert Lebensmittel für längere Haltbarkeit oder Sous-Vide-Garen." />
              </Label>
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
        <h3 className="font-semibold flex items-center gap-2">
          <Refrigerator className="w-5 h-5 text-primary" />
          Kühlen & Gefrieren
          <InfoTooltip 
            description="Die richtige Kühlgeräte-Wahl hängt von Haushaltsgröße, Einkaufsgewohnheiten und verfügbarem Platz ab."
            recommendation="Einbaugeräte integrieren sich nahtlos. Side-by-Side bietet viel Platz für große Familien."
          />
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Art des Kühlschranks
              <InfoTooltip description="Einbau verschwindet hinter der Küchenfront. Side-by-Side hat Kühl- und Gefrierteil nebeneinander. French Door hat breiten Kühlteil oben und Gefrierschubladen unten." />
            </Label>
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
                <Label htmlFor="wein" className="flex items-center gap-1">
                  Weinkühlschrank
                  <InfoTooltip description="Lagert Wein bei optimaler Temperatur (12-18°C) und Luftfeuchtigkeit. Für Weinliebhaber empfehlenswert." />
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Geschirrspüler */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Microwave className="w-5 h-5 text-primary" />
          Geschirrspüler
          <InfoTooltip 
            description="Der Geschirrspüler sollte zur Haushaltsgröße passen. Hocheinbau ist ergonomisch, 60 cm fasst mehr als 45 cm."
          />
        </h3>
        <div className="flex items-center gap-2 mb-4">
          <Checkbox id="dw" checked={data.appliances.dishwasher} onCheckedChange={c => updateAppliances({ dishwasher: !!c })} />
          <Label htmlFor="dw" className="font-medium">Geschirrspüler gewünscht</Label>
        </div>
        {data.appliances.dishwasher && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Einbauhöhe
                <InfoTooltip description="Hocheinbau (ca. 40 cm angehoben) schont den Rücken beim Ein- und Ausräumen." recommendation="Hocheinbau bei täglicher Nutzung." />
              </Label>
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
              <Label className="flex items-center gap-1">
                Breite
                <InfoTooltip description="60 cm fasst ca. 13-14 Maßgedecke. 45 cm fasst ca. 9-10 Maßgedecke und spart Platz." recommendation="60 cm für Haushalte ab 3 Personen." />
              </Label>
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
              <Label className="flex items-center gap-1">
                Integrationsart
                <InfoTooltip description="Vollintegriert: Bedienfeld oben an der Tür, komplett verdeckt. Teilintegriert: Bedienfeld sichtbar an der Front." />
              </Label>
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
        <h3 className="font-semibold flex items-center gap-2">
          Bevorzugte Gerätemarken
          <InfoTooltip 
            description="Die Markenwahl beeinflusst Preis, Qualität, Service und Ersatzteilversorgung."
            recommendation="Miele und Gaggenau sind Premium. Siemens/Bosch/Neff bieten gutes Preis-Leistungs-Verhältnis."
          />
        </h3>
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
