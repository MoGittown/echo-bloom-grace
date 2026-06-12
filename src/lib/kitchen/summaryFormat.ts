// Geteilte Konstanten & reine Helfer für die Zusammenfassung (Summary/PDF/CSV/E-Mail).
// Bewusst frei von React/DOM, damit die Logik isoliert testbar ist.

export const ELEMENT_TYPE_LABELS: Record<string, string> = {
  window: 'Fenster',
  door: 'Tür',
  socket: 'Steckdose',
  water: 'Wasseranschluss',
  gas: 'Gasanschluss',
  drain: 'Abfluss',
  vent: 'Lüftung',
};

export const WALL_LABELS: Record<string, string> = {
  north: 'Norden',
  east: 'Osten',
  south: 'Süden',
  west: 'Westen',
};

export const ELEMENT_COLORS: Record<string, string> = {
  window: 'hsl(140, 55%, 42%)',
  door: 'hsl(30, 60%, 45%)',
  socket: 'hsl(45, 90%, 50%)',
  water: 'hsl(200, 90%, 50%)',
  gas: 'hsl(15, 90%, 50%)',
  drain: 'hsl(210, 50%, 40%)',
  vent: 'hsl(180, 40%, 50%)',
};

/** Filtert getaggte Einträge (z. B. "Oberfläche:Matt") und entfernt das Präfix. */
export const getTaggedItems = (items: string[] | undefined, prefix: string): string[] => {
  if (!items) return [];
  return items
    .filter((i) => i.startsWith(prefix))
    .map((i) => i.replace(prefix, ''));
};

/** Liefert freie Einträge ohne Tag-Präfix (kein ":" enthalten). */
export const getUntaggedItems = (items: string[] | undefined): string[] => {
  if (!items) return [];
  return items.filter((i) => !i.includes(':'));
};
