import { RoomDimensions } from '@/types/kitchen';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Ruler, Square, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoomFormProps {
  data: RoomDimensions;
  onChange: (data: Partial<RoomDimensions>) => void;
}

const roomShapes = [
  { value: 'rectangular', label: 'Rechteckig', icon: '▭' },
  { value: 'l-shaped', label: 'L-Form', icon: '⌐' },
  { value: 'u-shaped', label: 'U-Form', icon: '⊔' },
  { value: 'galley', label: 'Schlauch', icon: '═' },
] as const;

export function RoomForm({ data, onChange }: RoomFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Raummaße
        </h2>
        <p className="text-muted-foreground mt-2">
          Geben Sie die Abmessungen des Küchenraums ein
        </p>
      </div>

      {/* Room Shape Selection */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-base">
          <LayoutGrid className="w-5 h-5" />
          Raumform
        </Label>
        <RadioGroup
          value={data.shape}
          onValueChange={(value) => onChange({ shape: value as RoomDimensions['shape'] })}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {roomShapes.map((shape) => (
            <Label
              key={shape.value}
              htmlFor={shape.value}
              className={`
                kitchen-card p-4 cursor-pointer text-center transition-all
                ${data.shape === shape.value ? 'ring-2 ring-primary border-primary' : ''}
              `}
            >
              <RadioGroupItem value={shape.value} id={shape.value} className="sr-only" />
              <span className="text-3xl block mb-2">{shape.icon}</span>
              <span className="text-sm font-medium">{shape.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Dimensions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="length" className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Länge (cm) *
          </Label>
          <Input
            id="length"
            type="number"
            value={data.length}
            onChange={(e) => onChange({ length: parseInt(e.target.value) || 0 })}
            placeholder="400"
            className="kitchen-input"
            min={100}
            max={2000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="width" className="flex items-center gap-2">
            <Ruler className="w-4 h-4 rotate-90" />
            Breite (cm) *
          </Label>
          <Input
            id="width"
            type="number"
            value={data.width}
            onChange={(e) => onChange({ width: parseInt(e.target.value) || 0 })}
            placeholder="300"
            className="kitchen-input"
            min={100}
            max={2000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height" className="flex items-center gap-2">
            <Square className="w-4 h-4" />
            Deckenhöhe (cm) *
          </Label>
          <Input
            id="height"
            type="number"
            value={data.height}
            onChange={(e) => onChange({ height: parseInt(e.target.value) || 0 })}
            placeholder="250"
            className="kitchen-input"
            min={200}
            max={400}
          />
        </div>
      </div>

      {/* Visual Preview */}
      <div className="kitchen-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Square className="w-5 h-5" />
          Vorschau (Maßstab: ~1:50)
        </h3>
        <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
          <div
            className="border-2 border-floor-wall bg-kitchen-marble relative"
            style={{
              width: Math.min(data.length / 4, 300),
              height: Math.min(data.width / 4, 200),
            }}
          >
            {/* Length dimension */}
            <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center">
              <span className="text-xs font-mono bg-background px-2 py-1 rounded">
                {data.length} cm
              </span>
            </div>
            {/* Width dimension */}
            <div className="absolute -right-12 top-0 bottom-0 flex items-center">
              <span className="text-xs font-mono bg-background px-2 py-1 rounded transform rotate-90">
                {data.width} cm
              </span>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Raumfläche: {((data.length * data.width) / 10000).toFixed(2)} m²
        </p>
      </div>
    </motion.div>
  );
}