import { KitchenProject, TIMELINE_OPTIONS } from '@/types/kitchen';
import { escapeHtml } from '@/lib/htmlSanitizer';
import { ELEMENT_TYPE_LABELS, WALL_LABELS } from './summaryFormat';

/**
 * Baut den HTML-Body der Protokoll-Zusammenfassung (für die E-Mail an das Studio).
 * Reine Funktion ohne React/DOM – alle Nutzereingaben werden via escapeHtml entschärft.
 */
export function buildSummaryHtml(project: KitchenProject): string {
  const customerName =
    escapeHtml(`${project.customer.firstName} ${project.customer.lastName}`.trim()) || 'Unbekannt';
  const timeline = escapeHtml(
    TIMELINE_OPTIONS.find((t) => t.value === project.customer.timeline)?.label ||
      project.customer.timeline ||
      'Nicht angegeben',
  );

  let html = `
      <div class="section">
        <div class="section-title">👤 Kundendaten</div>
        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${customerName}</span></div>
        <div class="info-row"><span class="info-label">E-Mail:</span><span class="info-value">${escapeHtml(project.customer.email) || '-'}</span></div>
        <div class="info-row"><span class="info-label">Telefon:</span><span class="info-value">${escapeHtml(project.customer.phone) || '-'}</span></div>
        <div class="info-row"><span class="info-label">Adresse:</span><span class="info-value">${escapeHtml(project.customer.address) || '-'}, ${escapeHtml(project.customer.postalCode)} ${escapeHtml(project.customer.city)}</span></div>
        <div class="info-row"><span class="info-label">Zeitrahmen:</span><span class="info-value">${timeline}</span></div>
      </div>
      
      <div class="section">
        <div class="section-title">📐 Raummaße</div>
        <div class="info-row"><span class="info-label">Länge:</span><span class="info-value">${escapeHtml(String(project.room.length))} cm</span></div>
        <div class="info-row"><span class="info-label">Breite:</span><span class="info-value">${escapeHtml(String(project.room.width))} cm</span></div>
        <div class="info-row"><span class="info-label">Höhe:</span><span class="info-value">${escapeHtml(String(project.room.height))} cm</span></div>
      </div>
    `;

  if (project.floorPlan.elements.length > 0) {
    html += `
        <div class="section">
          <div class="section-title">📐 Grundriss & Anschlüsse</div>
          ${project.floorPlan.elements
            .map(
              (e) =>
                `<div class="info-row"><span class="info-label">${escapeHtml(ELEMENT_TYPE_LABELS[e.type] || e.type)} (${escapeHtml(WALL_LABELS[e.wall] || e.wall)}):</span>` +
                `<span class="info-value">${e.width} × ${e.height} cm · ${e.distanceFromLeft ?? 0} cm links · ${e.distanceFromFloor ?? 0} cm Boden</span></div>`,
            )
            .join('')}
        </div>
      `;
  }

  if (project.preferences.style.length > 0) {
    html += `
        <div class="section">
          <div class="section-title">🎨 Stil & Design</div>
          <div>${project.preferences.style.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join(' ')}</div>
        </div>
      `;
  }

  if (project.preferences.colors.length > 0 || project.preferences.materials.length > 0) {
    html += `
        <div class="section">
          <div class="section-title">🎨 Farben & Materialien</div>
          ${project.preferences.colors.length > 0 ? `<div><strong>Farben:</strong> ${project.preferences.colors.map((c) => `<span class="tag">${escapeHtml(c)}</span>`).join(' ')}</div>` : ''}
          ${project.preferences.materials.length > 0 ? `<div style="margin-top: 8px;"><strong>Materialien:</strong> ${project.preferences.materials.map((m) => `<span class="tag">${escapeHtml(m)}</span>`).join(' ')}</div>` : ''}
        </div>
      `;
  }

  if (
    project.preferences.appliances.cooktop ||
    project.preferences.appliances.oven ||
    project.preferences.appliances.hood
  ) {
    html += `
        <div class="section">
          <div class="section-title">🍳 Geräte</div>
          ${project.preferences.appliances.cooktop ? `<div class="info-row"><span class="info-label">Kochfeld:</span><span class="info-value">${escapeHtml(project.preferences.appliances.cooktop)}</span></div>` : ''}
          ${project.preferences.appliances.oven ? `<div class="info-row"><span class="info-label">Backofen:</span><span class="info-value">${escapeHtml(project.preferences.appliances.oven)}</span></div>` : ''}
          ${project.preferences.appliances.hood ? `<div class="info-row"><span class="info-label">Dunstabzug:</span><span class="info-value">${escapeHtml(project.preferences.appliances.hood)}</span></div>` : ''}
          ${project.preferences.appliances.fridge ? `<div class="info-row"><span class="info-label">Kühlschrank:</span><span class="info-value">${escapeHtml(project.preferences.appliances.fridge)}</span></div>` : ''}
        </div>
      `;
  }

  if (project.preferences.budget.min > 0 || project.preferences.budget.max > 0) {
    html += `
        <div class="section">
          <div class="section-title">💰 Budget</div>
          <div class="info-row"><span class="info-label">Budget:</span><span class="info-value">${project.preferences.budget.min.toLocaleString('de-DE')} € - ${project.preferences.budget.max.toLocaleString('de-DE')} €</span></div>
        </div>
      `;
  }

  if (project.additionalNotes) {
    html += `
        <div class="section">
          <div class="section-title">📝 Notizen</div>
          <p>${escapeHtml(project.additionalNotes)}</p>
        </div>
      `;
  }

  return html;
}
