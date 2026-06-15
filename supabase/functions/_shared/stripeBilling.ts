import Stripe from "npm:stripe@17.5.0";
import type { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { canAccessStudio, graceEndsAtFromNow, type SubscriptionStatus } from "./planAccess.ts";

type Supabase = ReturnType<typeof createClient>;

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

export function getStripe(): Stripe {
  const key = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  if (!key) throw new Error("missing_stripe_secret_key");
  // Deno/Edge runtime needs the fetch-based HTTP client; the default Node
  // client fails with "An error occurred with our connection to Stripe".
  return new Stripe(key, {
    apiVersion: "2024-11-20.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

function envTrim(name: string): string | null {
  return Deno.env.get(name)?.trim() || null;
}

export function priceIdForPlan(plan: SubscriptionPlan): string | null {
  if (plan === "starter") return envTrim("STRIPE_PRICE_STARTER");
  if (plan === "pro") return envTrim("STRIPE_PRICE_PRO");
  if (plan === "premium") return envTrim("STRIPE_PRICE_PREMIUM");
  return null;
}

export function planFromPriceId(priceId: string): SubscriptionPlan | null {
  const starter = envTrim("STRIPE_PRICE_STARTER");
  const pro = envTrim("STRIPE_PRICE_PRO");
  const premium = envTrim("STRIPE_PRICE_PREMIUM");
  if (priceId === starter) return "starter";
  if (priceId === pro) return "pro";
  if (priceId === premium) return "premium";
  return null;
}

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
      return "incomplete";
    case "paused":
      return "paused";
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

export function resolvePlanFromSubscription(subscription: Stripe.Subscription): SubscriptionPlan | null {
  const metaPlan = subscription.metadata?.plan;
  if (metaPlan === "starter" || metaPlan === "pro" || metaPlan === "premium") {
    return metaPlan;
  }
  const priceId = subscription.items.data[0]?.price?.id;
  if (priceId) return planFromPriceId(priceId);
  return null;
}

export function trialDays(): number {
  const raw = Deno.env.get("STRIPE_TRIAL_DAYS");
  const parsed = raw ? Number.parseInt(raw, 10) : 14;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 14;
}

export function shouldOfferTrial(studio: Record<string, unknown>): boolean {
  return !studio.stripe_subscription_id && studio.subscription_status !== "legacy";
}

export async function syncSubscriptionToStudio(
  supabase: Supabase,
  studioSlug: string,
  subscription: Stripe.Subscription,
  customerId?: string,
) {
  const { data: existing } = await supabase
    .from("studio_branding")
    .select("billing_grace_ends_at")
    .eq("studio_slug", studioSlug)
    .maybeSingle();

  const plan = resolvePlanFromSubscription(subscription);
  const status = mapStripeSubscriptionStatus(subscription.status);
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  const patch: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    trial_ends_at: trialEnd,
    updated_at: new Date().toISOString(),
  };
  if (status === "active" || status === "trialing") {
    patch.billing_grace_ends_at = null;
  } else if (status === "past_due") {
    const existingGrace = existing?.billing_grace_ends_at as string | null | undefined;
    if (!existingGrace || new Date(existingGrace).getTime() < Date.now()) {
      patch.billing_grace_ends_at = graceEndsAtFromNow();
    }
  }
  if (customerId) patch.stripe_customer_id = customerId;
  if (plan) patch.plan = plan;

  const { error } = await supabase
    .from("studio_branding")
    .update(patch)
    .eq("studio_slug", studioSlug);
  if (error) throw error;
}

export function toPublicBilling(studio: Record<string, unknown>) {
  const status = String(studio.subscription_status ?? "legacy") as SubscriptionStatus;
  const graceEndsAt = (studio.billing_grace_ends_at as string | null) ?? null;
  const access = canAccessStudio(status, graceEndsAt);
  return {
    plan: studio.plan ?? null,
    subscriptionStatus: status,
    trialEndsAt: studio.trial_ends_at ?? null,
    billingGraceEndsAt: graceEndsAt,
    billingEmail: studio.billing_email ?? studio.contact_email ?? null,
    hasStripeCustomer: Boolean(studio.stripe_customer_id),
    hasActiveSubscription: access.allowed,
    inGracePeriod: access.inGracePeriod,
  };
}
