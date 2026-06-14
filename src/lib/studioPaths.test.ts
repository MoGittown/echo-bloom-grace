import { describe, expect, it } from 'vitest';
import {
  isReservedStudioSlug,
  studioCheckPath,
  studioLandingPath,
  studioLandingUrl,
} from './studioPaths';

describe('studioPaths', () => {
  it('baut Pfade ohne /s/', () => {
    expect(studioLandingPath('vollmer-objektmoebel')).toBe('/vollmer-objektmoebel');
    expect(studioCheckPath('kuechen-mueller')).toBe('/kuechen-mueller/check');
  });

  it('baut absolute URLs', () => {
    expect(studioLandingUrl('https://kuechenready.de', 'vollmer')).toBe(
      'https://kuechenready.de/vollmer',
    );
  });

  it('blockiert reservierte Slugs', () => {
    expect(isReservedStudioSlug('admin')).toBe(true);
    expect(isReservedStudioSlug('start')).toBe(true);
    expect(isReservedStudioSlug('sales')).toBe(true);
    expect(isReservedStudioSlug('vollmer')).toBe(false);
  });
});
