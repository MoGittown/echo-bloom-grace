import { describe, expect, it } from 'vitest';
import {
  canAccessStudio,
  effectivePlan,
  planHasFeature,
  resolveStudioAccess,
} from './planFeatures';

describe('planFeatures', () => {
  it('gibt Bestandskunden Pro-Features', () => {
    expect(effectivePlan(null, 'legacy')).toBe('pro');
    expect(planHasFeature('pro', 'analytics')).toBe(true);
    expect(planHasFeature('starter', 'analytics')).toBe(false);
  });

  it('erlaubt Check bei active und trialing', () => {
    expect(canAccessStudio('active', null).allowed).toBe(true);
    expect(canAccessStudio('trialing', null).allowed).toBe(true);
    expect(canAccessStudio('canceled', null).allowed).toBe(false);
  });

  it('gewährt Grace Period bei past_due', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(canAccessStudio('past_due', future).allowed).toBe(true);
    expect(canAccessStudio('past_due', future).inGracePeriod).toBe(true);
    expect(canAccessStudio('past_due', past).allowed).toBe(false);
  });

  it('blockiert incomplete ohne Zahlung', () => {
    const access = resolveStudioAccess({ plan: 'starter', subscriptionStatus: 'incomplete' });
    expect(access.canAccessCheck).toBe(false);
    expect(access.features.analytics).toBe(false);
  });
});
