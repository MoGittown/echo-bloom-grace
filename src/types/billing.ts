export type SubscriptionPlan = 'starter' | 'pro' | 'premium';

export type SubscriptionStatus =
  | 'legacy'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'paused';

export interface BillingSnapshot {
  plan: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  billingGraceEndsAt: string | null;
  billingEmail: string | null;
  hasStripeCustomer: boolean;
  hasActiveSubscription: boolean;
  inGracePeriod: boolean;
}

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
};

export const PLAN_PRICES: Record<SubscriptionPlan, string> = {
  starter: '49 € / Monat',
  pro: '99 € / Monat',
  premium: 'individuell',
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  legacy: 'Bestandskunde',
  trialing: 'Testphase',
  active: 'Aktiv',
  past_due: 'Zahlung überfällig',
  canceled: 'Gekündigt',
  unpaid: 'Unbezahlt',
  incomplete: 'Einrichtung offen',
  paused: 'Pausiert',
};

import { canAccessStudio } from '@/lib/planFeatures';

export function isSubscriptionActive(
  status: SubscriptionStatus,
  graceEndsAt?: string | null,
): boolean {
  return canAccessStudio(status, graceEndsAt ?? null).allowed;
}

export function parseBillingSnapshot(raw: unknown): BillingSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const status = data.subscriptionStatus;
  if (typeof status !== 'string') return null;
  return {
    plan: (data.plan as SubscriptionPlan | null) ?? null,
    subscriptionStatus: status as SubscriptionStatus,
    trialEndsAt: (data.trialEndsAt as string | null) ?? null,
    billingGraceEndsAt: (data.billingGraceEndsAt as string | null) ?? null,
    billingEmail: (data.billingEmail as string | null) ?? null,
    hasStripeCustomer: Boolean(data.hasStripeCustomer),
    hasActiveSubscription: Boolean(data.hasActiveSubscription),
    inGracePeriod: Boolean(data.inGracePeriod),
  };
}
