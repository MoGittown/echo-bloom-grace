export type SubscriptionPlan = "starter" | "pro" | "premium";
export type SubscriptionStatus =
  | "legacy"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "paused";

export type PlanFeature = "analytics" | "manufacturerCatalog" | "kitchenChat";

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

export function graceDays(): number {
  const raw = Deno.env.get("STRIPE_GRACE_DAYS");
  const parsed = raw ? Number.parseInt(raw, 10) : 7;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
}

export function graceEndsAtFromNow(now = Date.now()): string {
  return new Date(now + graceDays() * 86400000).toISOString();
}

export function effectivePlan(
  plan: string | null | undefined,
  status: SubscriptionStatus,
): SubscriptionPlan {
  if (status === "legacy") return "pro";
  if (plan === "starter" || plan === "pro" || plan === "premium") return plan;
  return "starter";
}

export function canAccessStudio(
  status: SubscriptionStatus,
  graceEndsAt: string | null | undefined,
  nowMs = Date.now(),
): { allowed: boolean; inGracePeriod: boolean } {
  if (status === "legacy" || status === "active" || status === "trialing") {
    return { allowed: true, inGracePeriod: false };
  }
  if (status === "past_due" && graceEndsAt) {
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

export function assertStudioAccess(
  studio: Record<string, unknown>,
): { ok: true } | { ok: false; error: string } {
  const status = (studio.subscription_status ?? "legacy") as SubscriptionStatus;
  const grace = studio.billing_grace_ends_at as string | null | undefined;
  const { allowed } = canAccessStudio(status, grace);
  if (!allowed) {
    return { ok: false, error: "subscription_inactive" };
  }
  return { ok: true };
}

export function assertPlanFeature(
  studio: Record<string, unknown>,
  feature: PlanFeature,
): { ok: true } | { ok: false; error: string } {
  const status = (studio.subscription_status ?? "legacy") as SubscriptionStatus;
  const plan = effectivePlan(studio.plan as string | null, status);
  if (!planHasFeature(plan, feature)) {
    return { ok: false, error: "plan_upgrade_required" };
  }
  return { ok: true };
}
