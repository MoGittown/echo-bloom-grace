import { describe, expect, it } from 'vitest';
import { isSubscriptionActive, parseBillingSnapshot, STATUS_LABELS } from '@/types/billing';

describe('billing types', () => {
  it('erkennt aktive Abo-Status', () => {
    expect(isSubscriptionActive('active', null)).toBe(true);
    expect(isSubscriptionActive('legacy', null)).toBe(true);
    expect(isSubscriptionActive('trialing', null)).toBe(true);
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isSubscriptionActive('past_due', future)).toBe(true);
    expect(isSubscriptionActive('past_due', null)).toBe(false);
    expect(isSubscriptionActive('canceled', null)).toBe(false);
  });

  it('parst Billing-Snapshot aus API', () => {
    const snapshot = parseBillingSnapshot({
      plan: 'pro',
      subscriptionStatus: 'active',
      trialEndsAt: null,
      billingGraceEndsAt: null,
      billingEmail: 'office@studio.de',
      hasStripeCustomer: true,
      hasActiveSubscription: true,
      inGracePeriod: false,
    });
    expect(snapshot?.plan).toBe('pro');
    expect(snapshot?.subscriptionStatus).toBe('active');
    expect(STATUS_LABELS.active).toBe('Aktiv');
  });
});
