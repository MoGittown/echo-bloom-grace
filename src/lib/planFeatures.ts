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

export type PlanFeature = 'analytics' | 'manufacturerCatalog' | 'kitchenChat';

export const DEFAULT_GRACE_DAYS = 7;

export const PLAN_FEATURES: Record<SubscriptionPlan, Record<PlanFeature, boolean>> = {
  starter: {
    analytics: false,
    manufacturerCatalog: false,
    kitchenChat: false,
  },
  pro: {
    analytics: true,
    manufacturerCatalog: true,
    kitchenChat: true,
  },
  premium: {
    analytics: true,
    manufacturerCatalog: true,
    kitchenChat: true,
  },
};

export function graceDaysFromEnv(): number {
  return DEFAULT_GRACE_DAYS;
}

/** Bestandskunden ohne Plan → voller Funktionsumfang (wie Pro). */
export function effectivePlan(
  plan: SubscriptionPlan | null | undefined,
  status: SubscriptionStatus,
): SubscriptionPlan {
  if (status === 'legacy') return 'pro';
  if (plan === 'starter' || plan === 'pro' || plan === 'premium') return plan;
  return 'starter';
}

export function canAccessStudio(
  status: SubscriptionStatus,
  graceEndsAt: string | null | undefined,
  nowMs: number = Date.now(),
): { allowed: boolean; inGracePeriod: boolean } {
  if (status === 'legacy' || status === 'active' || status === 'trialing') {
    return { allowed: true, inGracePeriod: false };
  }
  if (status === 'past_due' && graceEndsAt) {
    const graceEnd = new Date(graceEndsAt).getTime();
    if (nowMs < graceEnd) {
      return { allowed: true, inGracePeriod: true };
    }
  }
  return { allowed: false, inGracePeriod: false };
}

export function planHasFeature(plan: SubscriptionPlan, feature: PlanFeature): boolean {
  return PLAN_FEATURES[plan][feature];
}

export interface StudioAccess {
  plan: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus;
  billingGraceEndsAt: string | null;
  effectivePlan: SubscriptionPlan;
  canAccessCheck: boolean;
  inGracePeriod: boolean;
  features: Record<PlanFeature, boolean>;
}

export function resolveStudioAccess(input: {
  plan?: SubscriptionPlan | null;
  subscriptionStatus?: SubscriptionStatus | string | null;
  billingGraceEndsAt?: string | null;
}): StudioAccess {
  const status = (input.subscriptionStatus ?? 'legacy') as SubscriptionStatus;
  const plan = input.plan ?? null;
  const billingGraceEndsAt = input.billingGraceEndsAt ?? null;
  const eff = effectivePlan(plan, status);
  const access = canAccessStudio(status, billingGraceEndsAt);

  return {
    plan,
    subscriptionStatus: status,
    billingGraceEndsAt,
    effectivePlan: eff,
    canAccessCheck: access.allowed,
    inGracePeriod: access.inGracePeriod,
    features: {
      analytics: planHasFeature(eff, 'analytics'),
      manufacturerCatalog: planHasFeature(eff, 'manufacturerCatalog'),
      kitchenChat: planHasFeature(eff, 'kitchenChat'),
    },
  };
}

export function parseStudioAccessFromBranding(data: Record<string, unknown>): StudioAccess {
  const plan = (data.plan as SubscriptionPlan | null) ?? null;
  const subscriptionStatus = (data.subscription_status as SubscriptionStatus) ?? 'legacy';
  const billingGraceEndsAt = (data.billing_grace_ends_at as string | null) ?? null;
  return resolveStudioAccess({ plan, subscriptionStatus, billingGraceEndsAt });
}
