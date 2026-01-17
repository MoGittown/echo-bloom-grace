import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2 } from "lucide-react";

export type PdfDebugLevel = "info" | "success" | "error";

export type PdfDebugEvent = {
  ts: number;
  level: PdfDebugLevel;
  message: string;
  details?: string;
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function levelToVariant(level: PdfDebugLevel): "outline" | "secondary" | "destructive" {
  if (level === "error") return "destructive";
  if (level === "success") return "secondary";
  return "outline";
}

export function PdfDebugConsole({
  open,
  onOpenChange,
  events,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: PdfDebugEvent[];
  onClear: () => void;
}) {
  const handleCopy = async () => {
    const text = events
      .map((e) => {
        const details = e.details ? `\n${e.details}` : "";
        return `[${formatTime(e.ts)}] ${e.level.toUpperCase()}: ${e.message}${details}`;
      })
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore (clipboard can be blocked)
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>PDF Debug-Konsole</DialogTitle>
          <DialogDescription>
            Zeigt die Schritte der PDF-Erstellung (Seiten, Render-Status und Fehlerdetails).
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border">
          <ScrollArea className="h-[360px]">
            <div className="p-3 space-y-3">
              {events.length === 0 ? (
                <div className="text-sm text-muted-foreground">Noch keine Debug-Einträge.</div>
              ) : (
                events.map((e, idx) => (
                  <div key={idx} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium break-words">{e.message}</div>
                        {e.details ? (
                          <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-muted p-2 text-xs text-muted-foreground">
                            {e.details}
                          </pre>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground font-mono">{formatTime(e.ts)}</span>
                        <Badge variant={levelToVariant(e.level)}>{e.level}</Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Kopieren
          </Button>
          <Button type="button" variant="outline" onClick={onClear} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Leeren
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
