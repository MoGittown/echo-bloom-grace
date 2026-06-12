import { describe, it, expect } from 'vitest';
import {
  ELEMENT_COLORS,
  ELEMENT_TYPE_LABELS,
  WALL_LABELS,
  getTaggedItems,
  getUntaggedItems,
} from './summaryFormat';

describe('summaryFormat – Konstanten', () => {
  it('Fenster ist grün (zur Abgrenzung vom Wasseranschluss)', () => {
    expect(ELEMENT_COLORS.window).toBe('hsl(140, 55%, 42%)');
    expect(ELEMENT_COLORS.water).not.toBe(ELEMENT_COLORS.window);
  });

  it('liefert deutsche Labels für Typen und Wände', () => {
    expect(ELEMENT_TYPE_LABELS.window).toBe('Fenster');
    expect(WALL_LABELS.north).toBe('Norden');
  });
});

describe('getTaggedItems', () => {
  it('filtert nach Präfix und entfernt es', () => {
    const items = ['Oberfläche:Matt', 'Oberfläche:Hochglanz', 'Nische:Glas'];
    expect(getTaggedItems(items, 'Oberfläche:')).toEqual(['Matt', 'Hochglanz']);
  });

  it('gibt bei undefined eine leere Liste zurück', () => {
    expect(getTaggedItems(undefined, 'X:')).toEqual([]);
  });
});

describe('getUntaggedItems', () => {
  it('behält nur Einträge ohne Tag-Präfix', () => {
    const items = ['Kochinsel', 'Oberfläche:Matt', 'Bartheke'];
    expect(getUntaggedItems(items)).toEqual(['Kochinsel', 'Bartheke']);
  });

  it('gibt bei undefined eine leere Liste zurück', () => {
    expect(getUntaggedItems(undefined)).toEqual([]);
  });
});
