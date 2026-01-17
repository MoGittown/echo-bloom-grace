import { useState, useRef, useCallback, useEffect } from 'react';
import { FloorPlan, WallElement, RoomDimensions } from '@/types/kitchen';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SquareStack, Droplets, Zap, Flame, Wind, DoorOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';

interface WallViewEditorProps {
  floorPlan: FloorPlan;
  room: RoomDimensions;
}

const WALLS = [
  { value: 'north', label: 'Nordwand' },
  { value: 'east', label: 'Ostwand' },
  { value: 'south', label: 'Südwand' },
  { value: 'west', label: 'Westwand' },
] as const;

const ELEMENT_TYPES = [
  { value: 'window', label: 'Fenster', color: 'hsl(200, 80%, 55%)' },
  { value: 'door', label: 'Tür', color: 'hsl(30, 60%, 45%)' },
  { value: 'socket', label: 'Steckdose', color: 'hsl(45, 90%, 50%)' },
  { value: 'water', label: 'Wasseranschluss', color: 'hsl(200, 90%, 50%)' },
  { value: 'gas', label: 'Gasanschluss', color: 'hsl(15, 90%, 50%)' },
  { value: 'drain', label: 'Abfluss', color: 'hsl(210, 50%, 40%)' },
  { value: 'vent', label: 'Lüftung', color: 'hsl(180, 40%, 50%)' },
] as const;

export function WallViewEditor({ floorPlan, room }: WallViewEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedWall, setSelectedWall] = useState<'north' | 'east' | 'south' | 'west'>('north');

  const scale = 0.4;
  const padding = 80;

  const wallWidth = selectedWall === 'north' || selectedWall === 'south' 
    ? room.length 
    : room.width;
  const wallHeight = room.height;

  const canvasWidth = wallWidth * scale + padding * 2;
  const canvasHeight = wallHeight * scale + padding * 2;

  const wallElements = floorPlan.elements.filter((e) => e.wall === selectedWall);

  const drawWallView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wall background
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(padding, padding, wallWidth * scale, wallHeight * scale);

    // Wall border
    ctx.strokeStyle = '#2d2a26';
    ctx.lineWidth = 4;
    ctx.strokeRect(padding, padding, wallWidth * scale, wallHeight * scale);

    // Floor line
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(padding - 20, padding + wallHeight * scale);
    ctx.lineTo(canvasWidth - padding + 20, padding + wallHeight * scale);
    ctx.stroke();

    // Ceiling line
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(padding - 10, padding);
    ctx.lineTo(canvasWidth - padding + 10, padding);
    ctx.stroke();

    // Draw grid (every 50cm)
    ctx.strokeStyle = '#e5e0d8';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);
    const gridSize = 50 * scale;
    for (let x = padding; x <= canvasWidth - padding; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + wallHeight * scale);
      ctx.stroke();
    }
    for (let y = padding; y <= padding + wallHeight * scale; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw dimensions
    ctx.font = '11px monospace';
    ctx.fillStyle = '#2d2a26';
    ctx.textAlign = 'center';

    // Width dimension (top)
    ctx.fillText(`${wallWidth} cm`, canvasWidth / 2, padding - 30);
    
    // Draw dimension arrows
    ctx.strokeStyle = '#2d2a26';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding - 20);
    ctx.lineTo(canvasWidth - padding, padding - 20);
    ctx.stroke();
    // Arrow ends
    ctx.beginPath();
    ctx.moveTo(padding, padding - 25);
    ctx.lineTo(padding, padding - 15);
    ctx.moveTo(canvasWidth - padding, padding - 25);
    ctx.lineTo(canvasWidth - padding, padding - 15);
    ctx.stroke();

    // Height dimension (right)
    ctx.save();
    ctx.translate(canvasWidth - padding + 45, padding + (wallHeight * scale) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`${wallHeight} cm`, 0, 0);
    ctx.restore();

    // Right dimension line
    ctx.beginPath();
    ctx.moveTo(canvasWidth - padding + 25, padding);
    ctx.lineTo(canvasWidth - padding + 25, padding + wallHeight * scale);
    ctx.stroke();

    // Draw elements
    wallElements.forEach((element) => {
      const elemX = padding + (element.distanceFromLeft || 0) * scale;
      const elemY = padding + wallHeight * scale - (element.distanceFromFloor || 0) * scale - element.height * scale;
      const elemWidth = element.width * scale;
      const elemHeight = element.height * scale;

      const elementType = ELEMENT_TYPES.find((t) => t.value === element.type);
      
      // Element fill
      ctx.fillStyle = elementType?.color || '#ccc';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(elemX, elemY, elemWidth, elemHeight);
      ctx.globalAlpha = 1;

      // Element border
      ctx.strokeStyle = '#2d2a26';
      ctx.lineWidth = 2;
      ctx.strokeRect(elemX, elemY, elemWidth, elemHeight);

      // Element label
      ctx.font = 'bold 10px Inter';
      ctx.fillStyle = '#2d2a26';
      ctx.textAlign = 'center';
      ctx.fillText(
        elementType?.label || element.type,
        elemX + elemWidth / 2,
        elemY + elemHeight / 2 + 4
      );

      // Dimension annotations
      ctx.font = '9px monospace';
      ctx.fillStyle = '#6b6560';

      // Width dimension below element
      ctx.fillText(
        `${element.width} cm`,
        elemX + elemWidth / 2,
        elemY + elemHeight + 14
      );

      // Height dimension to the left
      ctx.save();
      ctx.translate(elemX - 8, elemY + elemHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${element.height} cm`, 0, 0);
      ctx.restore();

      // Distance from left (bottom)
      if (element.distanceFromLeft && element.distanceFromLeft > 0) {
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(padding, padding + wallHeight * scale + 25);
        ctx.lineTo(elemX, padding + wallHeight * scale + 25);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText(
          `${element.distanceFromLeft} cm`,
          (padding + elemX) / 2,
          padding + wallHeight * scale + 38
        );
      }

      // Distance from floor (right side)
      if (element.distanceFromFloor && element.distanceFromFloor > 0) {
        const floorY = padding + wallHeight * scale;
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(elemX + elemWidth + 15, floorY);
        ctx.lineTo(elemX + elemWidth + 15, elemY + elemHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.save();
        ctx.translate(elemX + elemWidth + 28, (floorY + elemY + elemHeight) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${element.distanceFromFloor} cm`, 0, 0);
        ctx.restore();
      }
    });

    // Draw labels
    ctx.font = '14px Inter';
    ctx.fillStyle = '#2d2a26';
    ctx.textAlign = 'center';
    const wallLabel = WALLS.find((w) => w.value === selectedWall)?.label;
    ctx.fillText(wallLabel || '', canvasWidth / 2, canvasHeight - 15);

  }, [wallElements, wallWidth, wallHeight, scale, canvasWidth, canvasHeight, selectedWall]);

  useEffect(() => {
    drawWallView();
  }, [drawWallView]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Wandansichten
        </h2>
        <p className="text-muted-foreground mt-2">
          Bemaßte Frontansichten jeder Wand
        </p>
      </div>

      {/* Wall selector */}
      <div className="flex justify-center no-print">
        <div className="w-64 space-y-2">
          <Label>Wand auswählen</Label>
          <Select
            value={selectedWall}
            onValueChange={(value) => setSelectedWall(value as typeof selectedWall)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WALLS.map((wall) => (
                <SelectItem key={wall.value} value={wall.value}>
                  {wall.label} ({floorPlan.elements.filter((e) => e.wall === wall.value).length} Elemente)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center overflow-auto">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="kitchen-card max-w-full"
          style={{ maxHeight: '500px' }}
        />
      </div>

      {/* Elements on this wall */}
      {wallElements.length > 0 ? (
        <div className="kitchen-card p-4">
          <h3 className="font-semibold mb-3">
            Elemente auf dieser Wand ({wallElements.length})
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {wallElements.map((element) => {
              const type = ELEMENT_TYPES.find((t) => t.value === element.type);
              return (
                <div
                  key={element.id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: type?.color }}
                  />
                  <div>
                    <span className="font-medium">{type?.label}</span>
                    <div className="text-xs text-muted-foreground">
                      {element.width} × {element.height} cm • 
                      {element.distanceFromLeft} cm von links • 
                      {element.distanceFromFloor} cm vom Boden
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          Keine Elemente auf dieser Wand. Fügen Sie Elemente im Grundriss-Editor hinzu.
        </div>
      )}

      {/* Print all walls */}
      <div className="print-only space-y-8">
        {WALLS.map((wall) => {
          const elements = floorPlan.elements.filter((e) => e.wall === wall.value);
          if (elements.length === 0) return null;
          return (
            <div key={wall.value} className="page-break-before">
              <h3 className="text-xl font-semibold mb-4">{wall.label}</h3>
              {/* Wall view would be rendered here for print */}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}