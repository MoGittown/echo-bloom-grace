import { describe, it, expect } from 'vitest';
import { buildAnalyticsRow } from './analyticsCore';

describe('buildAnalyticsRow', () => {
  it('setzt Plattform, Typ und Slug korrekt', () => {
    const row = buildAnalyticsRow('funnel', 'step:room', 'vollmer', {}, 'sid-1');
    expect(row).toMatchObject({
      studio_slug: 'vollmer',
      session_id: 'sid-1',
      event_type: 'funnel',
      step: 'step:room',
      platform: 'web',
    });
  });

  it('macht aus fehlendem Slug null', () => {
    const row = buildAnalyticsRow('conversion', 'protocol_sent', undefined, {}, 'sid-2');
    expect(row.studio_slug).toBeNull();
  });

  it('kürzt überlange Step-Namen auf 80 Zeichen', () => {
    const longStep = 'x'.repeat(200);
    const row = buildAnalyticsRow('error', longStep, null, {}, 'sid-3');
    expect(row.step).toHaveLength(80);
  });

  it('übernimmt Metadaten', () => {
    const row = buildAnalyticsRow('error', 'pdf_export', 'vollmer', { message: 'boom' }, 'sid-4');
    expect(row.metadata).toEqual({ message: 'boom' });
  });
});
