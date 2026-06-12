import { KitchenProject, TIMELINE_OPTIONS } from '@/types/kitchen';
import { ELEMENT_TYPE_LABELS, WALL_LABELS } from './summaryFormat';

export interface BuildSummaryCsvOptions {
  /** Hersteller-Zeile nur aufnehmen, wenn das Feld im Branding aktiviert ist. */
  showManufacturerField: boolean;
}

/**
 * Erzeugt den CSV-Inhalt (Semikolon-getrennt, Felder gequotet) für den Export.
 * Reine Funktion ohne DOM – der Datei-Download bleibt in der Komponente.
 */
export function buildSummaryCsv(
  project: KitchenProject,
  { showManufacturerField }: BuildSummaryCsvOptions,
): string {
  const timeline =
    TIMELINE_OPTIONS.find((t) => t.value === project.customer.timeline)?.label ||
    project.customer.timeline ||
    '';

  const csvRows: string[][] = [
    ['Kategorie', 'Feld', 'Wert'],
    [''],
    ['=== KUNDENDATEN ===', '', ''],
    ['Kunde', 'Vorname', project.customer.firstName || ''],
    ['Kunde', 'Nachname', project.customer.lastName || ''],
    ['Kunde', 'E-Mail', project.customer.email || ''],
    ['Kunde', 'Telefon', project.customer.phone || ''],
    ['Kunde', 'Straße', project.customer.address || ''],
    ['Kunde', 'PLZ', project.customer.postalCode || ''],
    ['Kunde', 'Ort', project.customer.city || ''],
    ['Timeline', 'Gewünschter Montagezeitraum', timeline],
    ['Budget', 'Minimum (€)', project.preferences.budget.min.toString()],
    ['Budget', 'Maximum (€)', project.preferences.budget.max.toString()],
    [''],
    ['=== RAUMABMESSUNGEN ===', '', ''],
    ['Raum', 'Länge (cm)', project.room.length.toString()],
    ['Raum', 'Breite (cm)', project.room.width.toString()],
    ['Raum', 'Höhe (cm)', project.room.height.toString()],
    ['Raum', 'Form', project.room.shape || ''],
    ['Raum', 'Fläche (m²)', ((project.room.length * project.room.width) / 10000).toFixed(2)],
    [''],
    ['=== ERGONOMIE ===', '', ''],
    ['Ergonomie', 'Körpergröße(n) (cm)', (project.preferences.userHeights || []).join(', ')],
    ['Ergonomie', 'Aktuelle Arbeitsplattenhöhe (cm)', project.preferences.currentCountertopHeight?.toString() || ''],
    ['Ergonomie', 'Zufriedenheit mit aktueller Höhe', project.preferences.currentCountertopSatisfaction || ''],
    ['Ergonomie', 'Kochverhalten', project.preferences.cookingFrequency || ''],
    ['Ergonomie', 'Haushaltsgröße', project.preferences.householdSize || ''],
    ['Ergonomie', 'Griff-Präferenz', project.preferences.gripType || ''],
    [''],
    ['=== STIL & DESIGN ===', '', ''],
    ['Stil', 'Küchenstil', project.preferences.style.join(', ')],
    ['Stil', 'Frontenfarben', project.preferences.colors.join(', ')],
    ['Stil', 'Frontmaterial', project.preferences.materials.join(', ')],
    ['Stil', 'Arbeitsplatte', Array.isArray(project.preferences.countertop) ? project.preferences.countertop.join(', ') : (project.preferences.countertop || '')],
  ];

  if (showManufacturerField) {
    csvRows.push(['Stil', 'Hersteller', project.preferences.manufacturers.join(', ')]);
  }

  csvRows.push(
    [''],
    ['=== ELEKTROGERÄTE ===', '', ''],
    ['Geräte', 'Kochfeld', project.preferences.appliances.cooktop || ''],
    ['Geräte', 'Dunstabzug', project.preferences.appliances.hood || ''],
    ['Geräte', 'Backofen', project.preferences.appliances.oven || ''],
    ['Geräte', 'Kühlschrank', project.preferences.appliances.fridge || ''],
    ['Geräte', 'Geschirrspüler', project.preferences.appliances.dishwasher ? 'Ja' : 'Nein'],
    ['Geräte', 'Mikrowelle', project.preferences.appliances.microwave ? 'Ja' : 'Nein'],
    [''],
    ['=== SPÜLE & ARMATUR ===', '', ''],
    ['Spüle', 'Material', project.preferences.sink || ''],
    [''],
    ['=== ANSCHLÜSSE ===', '', ''],
  );

  project.floorPlan.elements.forEach((element) => {
    csvRows.push([
      'Anschluss',
      `${ELEMENT_TYPE_LABELS[element.type] || element.type} (${WALL_LABELS[element.wall]})`,
      `${element.width}×${element.height}cm, ${element.distanceFromLeft}cm v. links, ${element.distanceFromFloor}cm v. Boden`,
    ]);
  });

  csvRows.push(['']);
  csvRows.push(['=== NOTIZEN ===', '', '']);
  csvRows.push(['Notizen', 'Zusätzliche Notizen', (project.additionalNotes || '').replace(/\n/g, ' ')]);

  return csvRows
    .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(';'))
    .join('\n');
}
