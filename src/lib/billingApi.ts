import { supabase } from '@/integrations/supabase/client';
import type { BillingSnapshot, SubscriptionPlan } from '@/types/billing';
import { parseBillingSnapshot } from '@/types/billing';

const WEB_ORIGIN = import.meta.env.VITE_PUBLIC_WEB_URL || window.location.origin;

type CheckoutResult =
  | { ok: true; url: string | null; upgraded?: boolean }
  | { ok: false; error: string };

type PortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createCheckoutSession(params: {
  password: string;
  studioSlug: string;
  plan: SubscriptionPlan;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<CheckoutResult> {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      action: 'create-checkout-session',
      password: params.password,
      studioSlug: params.studioSlug,
      plan: params.plan,
      successUrl: params.successUrl ?? `${WEB_ORIGIN}/admin?billing=success`,
      cancelUrl: params.cancelUrl ?? `${WEB_ORIGIN}/admin?billing=cancel`,
    },
  });

  if (error || !data?.success) {
    return { ok: false, error: data?.error ?? error?.message ?? 'checkout_failed' };
  }
  if (data.upgraded) {
    return { ok: true, url: null, upgraded: true };
  }
  if (!data?.url) {
    return { ok: false, error: 'checkout_failed' };
  }
  return { ok: true, url: data.url as string };
}

export async function createPortalSession(params: {
  password: string;
  studioSlug: string;
  returnUrl?: string;
}): Promise<PortalResult> {
  const { data, error } = await supabase.functions.invoke('stripe-portal', {
    body: {
      action: 'create-portal-session',
      password: params.password,
      studioSlug: params.studioSlug,
      returnUrl: params.returnUrl ?? `${WEB_ORIGIN}/admin`,
    },
  });

  if (error || !data?.success || !data?.url) {
    return { ok: false, error: data?.error ?? error?.message ?? 'portal_failed' };
  }
  return { ok: true, url: data.url as string };
}

export async function fetchBillingSnapshot(params: {
  password: string;
  studioSlug?: string;
}): Promise<BillingSnapshot | null> {
  const { data, error } = await supabase.functions.invoke('branding-admin', {
    body: {
      action: 'get-billing',
      password: params.password,
      studioSlug: params.studioSlug,
      targetStudioSlug: params.studioSlug,
    },
  });

  if (error || !data?.success) return null;
  return parseBillingSnapshot(data.billing);
}

export type SalesCheckoutResult =
  | { ok: true; url: string | null; studioSlug: string; upgraded?: boolean }
  | { ok: false; error: string };

export async function createSalesCheckout(params: {
  salesKey: string;
  priceId: string;
  existingStudioSlug?: string;
  studioName?: string;
  billingEmail?: string;
  password?: string;
  studioSlug?: string;
}): Promise<SalesCheckoutResult> {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      action: 'create-sales-checkout',
      salesKey: params.salesKey,
      priceId: params.priceId,
      existingStudioSlug: params.existingStudioSlug,
      studioName: params.studioName,
      billingEmail: params.billingEmail,
      password: params.password,
      studioSlug: params.studioSlug,
    },
  });

  if (error || !data?.success) {
    return { ok: false, error: data?.error ?? error?.message ?? 'sales_checkout_failed' };
  }
  return {
    ok: true,
    url: (data.url as string | null) ?? null,
    studioSlug: data.studioSlug as string,
    upgraded: Boolean(data.upgraded),
  };
}

export interface PlatformStudio {
  studioName: string;
  studioSlug: string | null;
  plan: SubscriptionPlan | null;
  subscriptionStatus: string;
  subscribedAt: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  billingGraceEndsAt: string | null;
  billingEmail: string | null;
  isPlatformAdmin: boolean;
  createdAt: string | null;
}

export type PlatformOverviewResult =
  | { ok: true; studios: PlatformStudio[] }
  | { ok: false; error: string };

export async function fetchPlatformOverview(params: {
  password: string;
  studioSlug: string;
}): Promise<PlatformOverviewResult> {
  const { data, error } = await supabase.functions.invoke('platform-overview', {
    body: {
      password: params.password,
      studioSlug: params.studioSlug,
    },
  });

  if (error || !data?.success) {
    return { ok: false, error: data?.error ?? error?.message ?? 'platform_overview_failed' };
  }
  return { ok: true, studios: (data.studios as PlatformStudio[]) ?? [] };
}

export type RegisterResult =
  | { ok: true; url: string; studioSlug: string }
  | { ok: false; error: string };

export async function registerAndCheckout(params: {
  studioName: string;
  billingEmail: string;
  password: string;
  plan: SubscriptionPlan;
  studioSlug?: string;
}): Promise<RegisterResult> {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      action: 'register-and-checkout',
      studioName: params.studioName,
      billingEmail: params.billingEmail,
      password: params.password,
      plan: params.plan,
      studioSlug: params.studioSlug,
    },
  });

  if (error || !data?.success || !data?.url) {
    return { ok: false, error: data?.error ?? error?.message ?? 'registration_failed' };
  }
  return {
    ok: true,
    url: data.url as string,
    studioSlug: data.studioSlug as string,
  };
}
