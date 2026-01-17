import { useRef, useState } from 'react';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, Trash2, Settings2, Building2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export function BrandingSettings() {
  const { branding, updateBranding, uploadLogo, removeLogo, resetBranding } = useBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wählen Sie eine Bilddatei aus');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Das Bild darf maximal 5 MB groß sein');
      return;
    }

    setIsUploading(true);
    try {
      await uploadLogo(file);
      toast.success('Logo erfolgreich hochgeladen');
    } catch (error) {
      toast.error('Fehler beim Hochladen des Logos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Branding</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Studio-Branding
          </DialogTitle>
          <DialogDescription>
            Personalisieren Sie das Protokoll mit Ihrem Logo und Studionamen für einen professionellen Auftritt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Studio-Logo
            </Label>
            
            {branding.logoUrl ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                  <img 
                    src={branding.logoUrl} 
                    alt="Studio Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Ändern
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={removeLogo}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Entfernen
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-muted/50 hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isUploading ? 'Wird hochgeladen...' : 'Logo hochladen (PNG, JPG)'}
                </span>
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Empfohlen: Quadratisches Format, mind. 200×200 Pixel
            </p>
          </div>

          {/* Studio Name */}
          <div className="space-y-2">
            <Label htmlFor="studioName">Studioname</Label>
            <Input
              id="studioName"
              placeholder="Mein Küchenstudio GmbH"
              value={branding.studioName}
              onChange={(e) => updateBranding({ studioName: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Erscheint im Header des Protokolls
            </p>
          </div>

          {/* Show Default Branding Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Standard-Branding anzeigen</Label>
              <p className="text-xs text-muted-foreground">
                Zeigt "Küchen-Beratungsprotokoll" wenn kein eigenes Logo/Name vorhanden
              </p>
            </div>
            <Switch
              checked={branding.showDefaultBranding}
              onCheckedChange={(checked) => updateBranding({ showDefaultBranding: checked })}
            />
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetBranding}
              className="text-muted-foreground"
            >
              Branding zurücksetzen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
