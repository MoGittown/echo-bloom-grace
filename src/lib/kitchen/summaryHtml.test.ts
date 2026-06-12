import { describe, it, expect } from 'vitest';
import { createDefaultProject, KitchenProject } from '@/types/kitchen';
import { buildSummaryHtml } from './summaryHtml';

function makeProject(overrides: (p: KitchenProject) => void): KitchenProject {
  const p = createDefaultProject();
  overrides(p);
  return p;
}

describe('buildSummaryHtml', () => {
  it('enthält Kundendaten und Raummaße', () => {
    const project = makeProject((p) => {
      p.customer.firstName = 'Max';
      p.customer.lastName = 'Mustermann';
      p.room.length = 420;
    });
    const html = buildSummaryHtml(project);
    expect(html).toContain('Max Mustermann');
    expect(html).toContain('Kundendaten');
    expect(html).toContain('420');
  });

  it('entschärft HTML in Nutzereingaben (XSS-Schutz)', () => {
    const project = makeProject((p) => {
      p.customer.firstName = '<script>alert(1)</script>';
      p.customer.lastName = '';
    });
    const html = buildSummaryHtml(project);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('rendert den Stil-Abschnitt nur bei vorhandenem Stil', () => {
    const without = buildSummaryHtml(makeProject(() => {}));
    expect(without).not.toContain('Stil & Design');

    const withStyle = buildSummaryHtml(
      makeProject((p) => {
        p.preferences.style = ['Modern'];
      }),
    );
    expect(withStyle).toContain('Stil & Design');
    expect(withStyle).toContain('Modern');
  });

  it('rendert Notizen nur, wenn vorhanden', () => {
    const html = buildSummaryHtml(
      makeProject((p) => {
        p.additionalNotes = 'Bitte Kochinsel berücksichtigen';
      }),
    );
    expect(html).toContain('Notizen');
    expect(html).toContain('Bitte Kochinsel berücksichtigen');
  });

  it('übersetzt den Timeline-Wert in das lesbare Label', () => {
    const html = buildSummaryHtml(
      makeProject((p) => {
        p.customer.timeline = 'sofort';
      }),
    );
    expect(html).toContain('Sofort / So schnell wie möglich');
  });
});
