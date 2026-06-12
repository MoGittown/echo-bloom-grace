import { useState, useRef, useCallback, useEffect } from 'react';
import { FloorPlan, WallElement, RoomDimensions } from '@/types/kitchen';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  SquareStack,
  Plus,
  Trash2,
  Move,
  Droplets,
  Zap,
  Flame,
  Wind,
  DoorOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';

interface FloorPlanEditorProps {
  floorPlan: FloorPlan;
  room: RoomDimensions;
  onChange: (data: Partial<FloorPlan>) => void;
}

const ELEMENT_TYPES = [
  { value: 'window', label: 'Fenster', icon: SquareStack, color: 'hsl(140, 55%, 42%)' },
  { value: 'door', label: 'Tür', icon: DoorOpen, color: 'hsl(30, 60%, 45%)' },
  { value: 'socket', label: 'Steckdose', icon: Zap, color: 'hsl(45, 90%, 50%)' },
  { value: 'water', label: 'Wasseranschluss', icon: Droplets, color: 'hsl(200, 90%, 50%)' },
  { value: 'gas', label: 'Gasanschluss', icon: Flame, color: 'hsl(15, 90%, 50%)' },
  { value: 'drain', label: 'Abfluss', icon: Droplets, color: 'hsl(210, 50%, 40%)' },
  { value: 'vent', label: 'Lüftung', icon: Wind, color: 'hsl(180, 40%, 50%)' },
] as const;

const WALLS = [
  { value: 'north', label: 'Norden (oben)' },
  { value: 'east', label: 'Osten (rechts)' },
  { value: 'south', label: 'Süden (unten)' },
  { value: 'west', label: 'Westen (links)' },
] as const;

export function FloorPlanEditor({ floorPlan, room, onChange }: FloorPlanEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newElement, setNewElement] = useState<Partial<WallElement>>({
    type: 'window',
    wall: 'north',
    width: 100,
    height: 120,
    distanceFromLeft: 100,
    distanceFromFloor: 90,
  });

  const scale = 0.5; // 1cm = 0.5px for display
  const padding = 60;

  const canvasWidth = room.length * scale + padding * 2;
  const canvasHeight = room.width * scale + padding * 2;

  const drawFloorPlan = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e0d8';
    ctx.lineWidth = 0.5;
    const gridSize = 50 * scale; // 50cm grid
    for (let x = padding; x <= canvasWidth - padding; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvasHeight - padding);
      ctx.stroke();
    }
    for (let y = padding; y <= canvasHeight - padding; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();
    }

    // Draw walls
    ctx.strokeStyle = '#2d2a26';
    ctx.lineWidth = 8;
    ctx.strokeRect(padding, padding, room.length * scale, room.width * scale);

    // Draw compass
    ctx.font = '12px Inter';
    ctx.fillStyle = '#6b6560';
    ctx.textAlign = 'center';
    ctx.fillText('N', padding + (room.length * scale) / 2, padding - 15);
    ctx.fillText('S', padding + (room.length * scale) / 2, canvasHeight - padding + 25);
    ctx.fillText('W', padding - 20, padding + (room.width * scale) / 2);
    ctx.fillText('O', canvasWidth - padding + 20, padding + (room.width * scale) / 2);

    // Draw dimensions
    ctx.font = '11px monospace';
    ctx.fillStyle = '#2d2a26';
    
    // Top dimension (length)
    ctx.fillText(`${room.length} cm`, padding + (room.length * scale) / 2, padding - 35);
    
    // Right dimension (width)
    ctx.save();
    ctx.translate(canvasWidth - padding + 40, padding + (room.width * scale) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`${room.width} cm`, 0, 0);
    ctx.restore();

    // Draw elements
    floorPlan.elements.forEach((element) => {
      const elementType = ELEMENT_TYPES.find((t) => t.value === element.type);
      if (!elementType) return;

      let x = 0, y = 0;
      const elementWidth = element.width * scale;
      const elementHeight = Math.min(element.height * scale, 15);

      switch (element.wall) {
        case 'north':
          x = padding + (element.distanceFromLeft || 0) * scale;
          y = padding - elementHeight / 2;
          break;
        case 'south':
          x = padding + (element.distanceFromLeft || 0) * scale;
          y = canvasHeight - padding - elementHeight / 2;
          break;
        case 'east':
          x = canvasWidth - padding - elementHeight / 2;
          y = padding + (element.distanceFromLeft || 0) * scale;
          break;
        case 'west':
          x = padding - elementHeight / 2;
          y = padding + (element.distanceFromLeft || 0) * scale;
          break;
      }

      // Draw element
      ctx.fillStyle = elementType.color;
      ctx.strokeStyle = selectedElement === element.id ? '#c2410c' : '#2d2a26';
      ctx.lineWidth = selectedElement === element.id ? 3 : 1;

      if (element.wall === 'north' || element.wall === 'south') {
        ctx.fillRect(x, y, elementWidth, elementHeight);
        ctx.strokeRect(x, y, elementWidth, elementHeight);
        
        // Element label
        ctx.font = '9px Inter';
        ctx.fillStyle = '#2d2a26';
        ctx.textAlign = 'center';
        ctx.fillText(
          elementType.label,
          x + elementWidth / 2,
          element.wall === 'north' ? y - 5 : y + elementHeight + 12
        );
      } else {
        ctx.fillRect(x, y, elementHeight, elementWidth);
        ctx.strokeRect(x, y, elementHeight, elementWidth);
        
        // Element label
        ctx.save();
        ctx.font = '9px Inter';
        ctx.fillStyle = '#2d2a26';
        ctx.textAlign = 'center';
        ctx.translate(
          element.wall === 'west' ? x - 8 : x + elementHeight + 8,
          y + elementWidth / 2
        );
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(elementType.label, 0, 0);
        ctx.restore();
      }
    });

  }, [floorPlan, room, scale, canvasWidth, canvasHeight, selectedElement]);

  useEffect(() => {
    drawFloorPlan();
  }, [drawFloorPlan]);

  const handleAddElement = () => {
    const element: WallElement = {
      id: crypto.randomUUID(),
      type: newElement.type as WallElement['type'],
      wall: newElement.wall as WallElement['wall'],
      x: 0,
      y: 0,
      width: newElement.width || 100,
      height: newElement.height || 120,
      distanceFromFloor: newElement.distanceFromFloor,
      distanceFromLeft: newElement.distanceFromLeft,
    };

    onChange({ elements: [...floorPlan.elements, element] });
    setIsAddDialogOpen(false);
    setNewElement({
      type: 'window',
      wall: 'north',
      width: 100,
      height: 120,
      distanceFromLeft: 100,
      distanceFromFloor: 90,
    });
  };

  const handleDeleteElement = (id: string) => {
    onChange({ elements: floorPlan.elements.filter((e) => e.id !== id) });
    setSelectedElement(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on an element
    for (const element of floorPlan.elements) {
      let elemX = 0, elemY = 0, elemW = 0, elemH = 0;
      const elementWidth = element.width * scale;
      const elementHeight = Math.min(element.height * scale, 15);

      switch (element.wall) {
        case 'north':
          elemX = padding + (element.distanceFromLeft || 0) * scale;
          elemY = padding - elementHeight / 2;
          elemW = elementWidth;
          elemH = elementHeight;
          break;
        case 'south':
          elemX = padding + (element.distanceFromLeft || 0) * scale;
          elemY = canvasHeight - padding - elementHeight / 2;
          elemW = elementWidth;
          elemH = elementHeight;
          break;
        case 'east':
          elemX = canvasWidth - padding - elementHeight / 2;
          elemY = padding + (element.distanceFromLeft || 0) * scale;
          elemW = elementHeight;
          elemH = elementWidth;
          break;
        case 'west':
          elemX = padding - elementHeight / 2;
          elemY = padding + (element.distanceFromLeft || 0) * scale;
          elemW = elementHeight;
          elemH = elementWidth;
          break;
      }

      if (x >= elemX && x <= elemX + elemW && y >= elemY && y <= elemY + elemH) {
        setSelectedElement(element.id);
        return;
      }
    }

    setSelectedElement(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center justify-center gap-2">
          Grundriss-Editor
          <InfoTooltip 
            description="Hier erfassen Sie alle wichtigen Raumelemente wie Fenster, Türen und Anschlüsse mit exakten Positionen."
            recommendation="Messen Sie die Abstände von der linken Wandkante und vom Boden für jedes Element."
          />
        </h2>
        <p className="text-muted-foreground mt-2">
          Fügen Sie Fenster, Türen und Anschlüsse hinzu
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 justify-center no-print">
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Element hinzufügen
        </Button>
        {selectedElement && (
          <Button
            variant="destructive"
            onClick={() => handleDeleteElement(selectedElement)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Löschen
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        {ELEMENT_TYPES.map((type) => (
          <div key={type.value} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: type.color }}
            />
            <span>{type.label}</span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex justify-center overflow-auto">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          className="kitchen-card cursor-crosshair max-w-full"
          style={{ maxHeight: '500px' }}
        />
      </div>

      {/* Elements List */}
      {floorPlan.elements.length > 0 && (
        <div className="kitchen-card p-4">
          <h3 className="font-semibold mb-3">Eingetragene Elemente</h3>
          <div className="grid gap-2">
            {floorPlan.elements.map((element) => {
              const type = ELEMENT_TYPES.find((t) => t.value === element.type);
              const wall = WALLS.find((w) => w.value === element.wall);
              return (
                <div
                  key={element.id}
                  onClick={() => setSelectedElement(element.id)}
                  className={`
                    flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedElement === element.id ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: type?.color }}
                    />
                    <span className="font-medium">{type?.label}</span>
                    <span className="text-muted-foreground text-sm">
                      • {wall?.label}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {element.width} × {element.height} cm
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Element Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Element hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Elementtyp
                <InfoTooltip 
                  description="Wählen Sie die Art des Elements, das Sie im Grundriss platzieren möchten."
                  recommendation="Fenster: Lichtquelle und Belüftung • Tür: Zugang zum Raum • Steckdose: Stromversorgung für Geräte • Wasseranschluss: Für Spüle/Geschirrspüler • Gasanschluss: Für Gaskochfeld • Abfluss: Wasserablauf • Lüftung: Dunstabzug nach außen"
                />
              </Label>
              <Select
                value={newElement.type}
                onValueChange={(value) =>
                  setNewElement({ ...newElement, type: value as WallElement['type'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ELEMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Wand
                <InfoTooltip 
                  description="Wählen Sie die Wand, an der sich das Element befindet."
                  recommendation="Orientieren Sie sich am Kompass im Grundriss: N=Norden (oben), O=Osten (rechts), S=Süden (unten), W=Westen (links)"
                />
              </Label>
              <Select
                value={newElement.wall}
                onValueChange={(value) =>
                  setNewElement({ ...newElement, wall: value as WallElement['wall'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALLS.map((wall) => (
                    <SelectItem key={wall.value} value={wall.value}>
                      {wall.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Breite (cm)
                  <InfoTooltip 
                    description="Die Breite des Elements in Zentimetern."
                    recommendation="Fenster: typisch 60-200 cm • Türen: 70-100 cm • Anschlüsse: 10-20 cm"
                  />
                </Label>
                <Input
                  type="number"
                  value={newElement.width}
                  onChange={(e) =>
                    setNewElement({ ...newElement, width: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Höhe (cm)
                  <InfoTooltip 
                    description="Die Höhe des Elements in Zentimetern."
                    recommendation="Fenster: typisch 100-150 cm • Türen: 200-220 cm • Anschlüsse: 5-15 cm"
                  />
                </Label>
                <Input
                  type="number"
                  value={newElement.height}
                  onChange={(e) =>
                    setNewElement({ ...newElement, height: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Abstand von links (cm)
                  <InfoTooltip 
                    description="Der horizontale Abstand von der linken Ecke der gewählten Wand bis zur linken Kante des Elements."
                    recommendation="Messen Sie von der linken Wandecke (wenn Sie vor der Wand stehen) bis zum Beginn des Elements."
                  />
                </Label>
                <Input
                  type="number"
                  value={newElement.distanceFromLeft}
                  onChange={(e) =>
                    setNewElement({
                      ...newElement,
                      distanceFromLeft: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Höhe über Boden (cm)
                  <InfoTooltip 
                    description="Der vertikale Abstand vom Fußboden bis zur Unterkante des Elements."
                    recommendation="Fenster: typisch 80-100 cm (Brüstungshöhe) • Steckdosen: 30 cm oder 110 cm • Wasseranschluss: 50-60 cm"
                  />
                </Label>
                <Input
                  type="number"
                  value={newElement.distanceFromFloor}
                  onChange={(e) =>
                    setNewElement({
                      ...newElement,
                      distanceFromFloor: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddElement}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}