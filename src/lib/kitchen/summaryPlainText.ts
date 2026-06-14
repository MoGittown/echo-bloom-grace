import { KitchenProject, TIMELINE_OPTIONS } from '@/types/kitchen';
import { ELEMENT_TYPE_LABELS, WALL_LABELS } from './summaryFormat';

function section(title: string, lines: string[]): string {
  if (lines.length === 0) return '';
  return `${title}\n${'─'.repeat(title.length)}\n${lines.join('\n')}\n\n`;
}

/**
 * Lesbare Checkliste für den TXT-E-Mail-Anhang (wie in der Flutter-App).
 */
export function buildSummaryPlainText(project: KitchenProject): string {
  const customer = project.customer;
  const timeline =
    TIMELINE_OPTIONS.find((t) => t.value === customer.timeline)?.label ||
    customer.timeline ||
    'Nicht angegeben';

  const floorPlanLines = [
    `Form: ${project.room.shape || 'rechteckig'}`,
    `Maße: ${project.room.length} × ${project.room.width} × ${project.room.height} cm`,
    ...project.floorPlan.elements.map(
      (e) =>
        `${ELEMENT_TYPE_LABELS[e.type] || e.type} (${WALL_LABELS[e.wall] || e.wall}): ` +
        `${e.width} × ${e.height} cm · ${e.distanceFromLeft ?? 0} cm von links · ` +
        `${e.distanceFromFloor ?? 0} cm vom Boden`,
    ),
  ];

  const parts = [
    section('Kundendaten', [
      `Name: ${customer.firstName} ${customer.lastName}`.trim(),
      `E-Mail: ${customer.email || '-'}`,
      `Telefon: ${customer.phone || '-'}`,
      `Adresse: ${[customer.address, customer.postalCode, customer.city].filter(Boolean).join(', ') || '-'}`,
      `Zeitrahmen: ${timeline}`,
    ]),
    section('Raum & Grundriss', floorPlanLines),
    section('Stil & Design', [
      project.preferences.style.length ? `Stil: ${project.preferences.style.join(', ')}` : '',
      project.preferences.colors.length ? `Farben: ${project.preferences.colors.join(', ')}` : '',
      project.preferences.materials.length ? `Materialien: ${project.preferences.materials.join(', ')}` : '',
    ].filter(Boolean)),
    section('Budget', [
      project.preferences.budget.min || project.preferences.budget.max
        ? `${project.preferences.budget.min.toLocaleString('de-DE')} – ${project.preferences.budget.max.toLocaleString('de-DE')} €`
        : '',
    ].filter(Boolean)),
    section('Geräte', [
      project.preferences.appliances.cooktop ? `Kochfeld: ${project.preferences.appliances.cooktop}` : '',
      project.preferences.appliances.oven ? `Backofen: ${project.preferences.appliances.oven}` : '',
      project.preferences.appliances.hood ? `Dunstabzug: ${project.preferences.appliances.hood}` : '',
      project.preferences.appliances.fridge ? `Kühlschrank: ${project.preferences.appliances.fridge}` : '',
    ].filter(Boolean)),
    section('Notizen', project.additionalNotes ? [project.additionalNotes] : []),
  ];

  return parts.join('').trim();
}

export function buildProjectJsonForEmail(project: KitchenProject): string {
  const clone = JSON.parse(JSON.stringify(project)) as KitchenProject;
  if (Array.isArray(clone.photos)) {
    clone.photos = clone.photos.map((p) => {
      const { preview, ...rest } = p as { preview?: string };
      return { ...rest, hasPreview: Boolean(preview) };
    });
  }
  return JSON.stringify(clone, null, 2);
}
