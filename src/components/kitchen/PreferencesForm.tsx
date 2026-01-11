import { KitchenPreferences, KITCHEN_STYLES, KITCHEN_COLORS, KITCHEN_MATERIALS, KITCHEN_MANUFACTURERS, APPLIANCE_TYPES, COUNTERTOP_MATERIALS, STORAGE_OPTIONS } from '@/types/kitchen';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Heart, Star, Euro, ChefHat, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface PreferencesFormProps {
  data: KitchenPreferences;
  onChange: (data: Partial<KitchenPreferences>) => void;
}

export function PreferencesForm({ data, onChange }: PreferencesFormProps) {
  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Wünsche & Vorlieben
        </h2>
        <p className="text-muted-foreground mt-2">
          Stil, Materialien, Geräte und Budget
        </p>
      </div>

      {/* Style Selection */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Küchenstil
        </h3>
        <div className="flex flex-wrap gap-2">
          {KITCHEN_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => onChange({ style: toggleArrayItem(data.style, style) })}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${data.style.includes(style)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Farbwünsche
        </h3>
        <div className="flex flex-wrap gap-2">
          {KITCHEN_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChange({ colors: toggleArrayItem(data.colors, color) })}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${data.colors.includes(color)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Materials */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Frontmaterial
        </h3>
        <div className="flex flex-wrap gap-2">
          {KITCHEN_MATERIALS.map((material) => (
            <button
              key={material}
              onClick={() => onChange({ materials: toggleArrayItem(data.materials, material) })}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${data.materials.includes(material)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {material}
            </button>
          ))}
        </div>
      </div>

      {/* Countertop */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Arbeitsplatte</h3>
        <div className="flex flex-wrap gap-2">
          {COUNTERTOP_MATERIALS.map((material) => (
            <button
              key={material}
              onClick={() => onChange({ countertop: toggleArrayItem(data.countertop, material) })}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${data.countertop.includes(material)
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {material}
            </button>
          ))}
        </div>
      </div>

      {/* Manufacturers */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold">Bevorzugte Hersteller</h3>
        <div className="flex flex-wrap gap-2">
          {KITCHEN_MANUFACTURERS.map((manufacturer) => (
            <button
              key={manufacturer}
              onClick={() => onChange({ manufacturers: toggleArrayItem(data.manufacturers, manufacturer) })}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${data.manufacturers.includes(manufacturer)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {manufacturer}
            </button>
          ))}
        </div>
      </div>

      {/* Appliances */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary" />
          Elektrogeräte
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kochfeld</Label>
            <Select
              value={data.appliances.cooktop}
              onValueChange={(value) =>
                onChange({ appliances: { ...data.appliances, cooktop: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {APPLIANCE_TYPES.cooktop.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Backofen</Label>
            <Select
              value={data.appliances.oven}
              onValueChange={(value) =>
                onChange({ appliances: { ...data.appliances, oven: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {APPLIANCE_TYPES.oven.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kühlschrank</Label>
            <Select
              value={data.appliances.fridge}
              onValueChange={(value) =>
                onChange({ appliances: { ...data.appliances, fridge: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {APPLIANCE_TYPES.fridge.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dunstabzug</Label>
            <Select
              value={data.appliances.hood}
              onValueChange={(value) =>
                onChange({ appliances: { ...data.appliances, hood: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {APPLIANCE_TYPES.hood.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dishwasher"
              checked={data.appliances.dishwasher}
              onCheckedChange={(checked) =>
                onChange({ appliances: { ...data.appliances, dishwasher: !!checked } })
              }
            />
            <Label htmlFor="dishwasher">Geschirrspüler</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="microwave"
              checked={data.appliances.microwave}
              onCheckedChange={(checked) =>
                onChange({ appliances: { ...data.appliances, microwave: !!checked } })
              }
            />
            <Label htmlFor="microwave">Mikrowelle</Label>
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Stauraum-Lösungen
        </h3>
        <div className="flex flex-wrap gap-2">
          {STORAGE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => onChange({ storage: toggleArrayItem(data.storage, option) })}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${data.storage.includes(option)
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Euro className="w-5 h-5 text-primary" />
          Budgetrahmen
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between text-sm">
            <span>€{data.budget.min.toLocaleString()}</span>
            <span>€{data.budget.max.toLocaleString()}</span>
          </div>
          <Slider
            value={[data.budget.min, data.budget.max]}
            min={5000}
            max={100000}
            step={1000}
            onValueChange={([min, max]) =>
              onChange({ budget: { min, max } })
            }
            className="w-full"
          />
          <p className="text-center text-muted-foreground">
            Budget: €{data.budget.min.toLocaleString()} - €{data.budget.max.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Must-haves & Nice-to-haves */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="kitchen-card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive" />
            Must-Haves
          </h3>
          <Textarea
            value={data.mustHaves.join('\n')}
            onChange={(e) =>
              onChange({ mustHaves: e.target.value.split('\n').filter((s) => s.trim()) })
            }
            placeholder="Ein Wunsch pro Zeile, z.B.:&#10;- Große Arbeitsfläche&#10;- Kochinsel&#10;- Einbau-Kaffeevollautomat"
            className="kitchen-input min-h-[120px]"
          />
        </div>

        <div className="kitchen-card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Nice-to-Haves
          </h3>
          <Textarea
            value={data.niceToHaves.join('\n')}
            onChange={(e) =>
              onChange({ niceToHaves: e.target.value.split('\n').filter((s) => s.trim()) })
            }
            placeholder="Ein Wunsch pro Zeile, z.B.:&#10;- Weinkühlschrank&#10;- Smart-Home Integration&#10;- Ambient-Beleuchtung"
            className="kitchen-input min-h-[120px]"
          />
        </div>
      </div>
    </motion.div>
  );
}