import { describe, it, expect } from 'vitest';
import { createDefaultProject, KitchenProject } from '@/types/kitchen';
import { buildSummaryCsv } from './summaryCsv';

function makeProject(overrides: (p: KitchenProject) => void = () => {}): KitchenProject {
  const p = createDefaultProject();
  overrides(p);
  return p;
}

describe('buildSummaryCsv', () => {
  it('beginnt mit der Kopfzeile (Semikolon-getrennt, gequotet)', () => {
    const csv = buildSummaryCsv(makeProject(), { showManufacturerField: false });
    expect(csv.split('\n')[0]).toBe('"Kategorie";"Feld";"Wert"');
  });

  it('nimmt die Hersteller-Zeile nur bei aktiviertem Feld auf', () => {
    const project = makeProject((p) => {
      p.preferences.manufacturers = ['Nobilia'];
    });
    expect(buildSummaryCsv(project, { showManufacturerField: false })).not.toContain('Nobilia');
    const withField = buildSummaryCsv(project, { showManufacturerField: true });
    expect(withField).toContain('"Stil";"Hersteller";"Nobilia"');
  });

  it('rendert Grundriss-Elemente mit deutschen Labels', () => {
    const project = makeProject((p) => {
      p.floorPlan.elements = [
        {
          id: '1',
          type: 'window',
          wall: 'north',
          x: 0,
          y: 0,
          width: 120,
          height: 140,
          distanceFromLeft: 50,
          distanceFromFloor: 90,
        },
      ];
    });
    const csv = buildSummaryCsv(project, { showManufacturerField: false });
    expect(csv).toContain('Fenster (Norden)');
    expect(csv).toContain('120×140cm');
  });

  it('escaped Anführungszeichen in Werten (verdoppelt)', () => {
    const project = makeProject((p) => {
      p.customer.firstName = 'Max "Der Chef"';
    });
    const csv = buildSummaryCsv(project, { showManufacturerField: false });
    expect(csv).toContain('"Max ""Der Chef"""');
  });

  it('gibt Geschirrspüler-Boolean als Ja/Nein aus', () => {
    const csv = buildSummaryCsv(
      makeProject((p) => {
        p.preferences.appliances.dishwasher = true;
        p.preferences.appliances.microwave = false;
      }),
      { showManufacturerField: false },
    );
    expect(csv).toContain('"Geräte";"Geschirrspüler";"Ja"');
    expect(csv).toContain('"Geräte";"Mikrowelle";"Nein"');
  });
});
