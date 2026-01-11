import { useCallback, useState } from 'react';
import { UploadedPhoto } from '@/types/kitchen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, ImagePlus, X, Home, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoUploadProps {
  photos: UploadedPhoto[];
  onAdd: (photo: UploadedPhoto) => void;
  onRemove: (photoId: string) => void;
}

export function PhotoUpload({ photos, onAdd, onRemove }: PhotoUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = useCallback(
    (files: FileList | null, type: 'room' | 'inspiration') => {
      if (!files) return;

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = () => {
          const photo: UploadedPhoto = {
            id: crypto.randomUUID(),
            file,
            preview: reader.result as string,
            type,
          };
          onAdd(photo);
        };
        reader.readAsDataURL(file);
      });
    },
    [onAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, type: 'room' | 'inspiration') => {
      e.preventDefault();
      setDragOver(false);
      handleFileChange(e.dataTransfer.files, type);
    },
    [handleFileChange]
  );

  const roomPhotos = photos.filter((p) => p.type === 'room');
  const inspirationPhotos = photos.filter((p) => p.type === 'inspiration');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Fotos
        </h2>
        <p className="text-muted-foreground mt-2">
          Laden Sie Fotos des Raumes und Inspirationsbilder hoch
        </p>
      </div>

      {/* Room Photos */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Home className="w-5 h-5 text-primary" />
          Raumfotos
        </h3>
        <p className="text-sm text-muted-foreground">
          Aktuelle Fotos des Küchenraums aus verschiedenen Blickwinkeln
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => handleDrop(e, 'room')}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}
          `}
        >
          <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Fotos hierher ziehen oder klicken zum Auswählen
          </p>
          <Label htmlFor="room-upload" className="cursor-pointer">
            <Button asChild variant="outline">
              <span>
                <ImagePlus className="w-4 h-4 mr-2" />
                Fotos auswählen
              </span>
            </Button>
          </Label>
          <Input
            id="room-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files, 'room')}
          />
        </div>

        {/* Room photo grid */}
        <AnimatePresence>
          {roomPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {roomPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square"
                >
                  <img
                    src={photo.preview}
                    alt="Raumfoto"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => onRemove(photo.id)}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Inspiration Photos */}
      <div className="kitchen-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Inspirationsbilder
        </h3>
        <p className="text-sm text-muted-foreground">
          Bilder von Küchen, die dem Kunden gefallen
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => handleDrop(e, 'inspiration')}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${dragOver ? 'border-accent bg-accent/5' : 'border-border'}
          `}
        >
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Inspirationsbilder hierher ziehen oder klicken
          </p>
          <Label htmlFor="inspiration-upload" className="cursor-pointer">
            <Button asChild variant="outline">
              <span>
                <ImagePlus className="w-4 h-4 mr-2" />
                Bilder auswählen
              </span>
            </Button>
          </Label>
          <Input
            id="inspiration-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files, 'inspiration')}
          />
        </div>

        {/* Inspiration photo grid */}
        <AnimatePresence>
          {inspirationPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {inspirationPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square"
                >
                  <img
                    src={photo.preview}
                    alt="Inspiration"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => onRemove(photo.id)}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}