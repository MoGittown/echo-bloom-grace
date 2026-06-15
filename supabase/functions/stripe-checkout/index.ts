import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabaseAdmin.ts";
import { verifyStudioAdmin, fetchStudioBySlug } from "../_shared/studioAuth.ts";
import { hashPassword } from "../_shared/password.ts";
import { verifySalesKey } from "../_shared/salesAuth.ts";
import {
  DEFAULT_FEATURE_CONFIG,
  ensureUniqueSlug,
  isReservedStudioSlug,
  slugifyStudioName,
} from "../_shared/studioSlug.ts";
import {
  getStripe,
  priceIdForPlan,
  shouldOfferTrial,
  syncSubscriptionToStudio,
  trialDays,
  type SubscriptionPlan,
} from "../_shared/stripeBilling.ts";

const WEB_ORIGIN = Deno.env.get("PUBLIC_WEB_URL") ?? "https://kuechenready.de";

const UPGRADABLE_STATUSES = new Set(["active", "trialing", "past_due"]);

type CheckoutOutcome =
  | { upgraded: true; url: null; sessionId: null }
  | { upgraded: false; url: string | null; sessionId: string | null };

async function ensureStripeCustomer(
  supabase: ReturnType<typeof createServiceClient>,
  studio: Record<string, unknown>,
): Promise<string> {
  const stripe = getStripe();
  const normalizedSlug = studio.studio_slug as string;
  let customerId = studio.stripe_customer_id as string | null;
  if (customerId) return customerId;

  const billingEmail = (studio.billing_email ?? studio.contact_email) as string | null;
  const customer = await stripe.customers.create({
    email: billingEmail ?? undefined,
    name: (studio.display_app_name ?? studio.studio_name) as string,
    metadata: { studio_slug: normalizedSlug },
  });
  customerId = customer.id;
  await supabase
    .from("studio_branding")
    .update({ stripe_customer_id: customerId })
    .eq("id", studio.id);
  return customerId;
}

async function createCheckoutForStudio(
  studio: Record<string, unknown>,
  plan: SubscriptionPlan,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  options?: { skipTrial?: boolean },
): Promise<CheckoutOutcome> {
  const supabase = createServiceClient();
  const stripe = getStripe();
  const normalizedSlug = studio.studio_slug as string;
  const customerId = await ensureStripeCustomer(supabase, studio);

  const existingSubId = studio.stripe_subscription_id as string | null;
  const status = studio.subscription_status as string;

  if (existingSubId && UPGRADABLE_STATUSES.has(status)) {
    const sub = await stripe.subscriptions.retrieve(existingSubId);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) throw new Error("subscription_item_missing");

    const updated = await stripe.subscriptions.update(existingSubId, {
      items: [{ id: itemId, price: priceId }],
      metadata: { studio_slug: normalizedSlug, plan },
      proration_behavior: "create_prorations",
    });
    await syncSubscriptionToStudio(supabase, normalizedSlug, updated, customerId);
    return { upgraded: true, url: null, sessionId: null };
  }

  const subscriptionData: Record<string, unknown> = {
    metadata: { studio_slug: normalizedSlug, plan },
  };
  if (!options?.skipTrial && shouldOfferTrial(studio)) {
    subscriptionData.trial_period_days = trialDays();
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: "de",
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    customer_update: { name: "auto", address: "auto" },
    metadata: { studio_slug: normalizedSlug, plan },
    subscription_data: subscriptionData,
    allow_promotion_codes: true,
  });

  return { upgraded: false, url: session.url, sessionId: session.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "method_not_allowed" }, 405);
  }

  try {
    const body = await req.json();
    const action = body.action as string | undefined;
    const supabase = createServiceClient();

    if (action === "diag-stripe") {
      const raw = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
      const diag: Record<string, unknown> = {
        present: Boolean(raw),
        len: raw.length,
        trimmedLen: raw.trim().length,
        prefix: raw.slice(0, 8),
        hasWhitespace: /\s/.test(raw),
        priceStarter: Boolean(Deno.env.get("STRIPE_PRICE_STARTER")),
        pricePro: Boolean(Deno.env.get("STRIPE_PRICE_PRO")),
      };
      try {
        const stripe = getStripe();
        const prices = await stripe.prices.list({ limit: 1 });
        diag.stripeOk = true;
        diag.priceCount = prices.data.length;
      } catch (e) {
        diag.stripeOk = false;
        diag.stripeErr = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      }
      return jsonResponse({ success: true, diag });
    }

    if (action === "create-sales-checkout") {
      if (!verifySalesKey(body.salesKey as string | undefined)) {
        return jsonResponse({ success: false, error: "invalid_sales_key" }, 403);
      }

      const priceId = (body.priceId as string | undefined)?.trim();
      if (!priceId || !priceId.startsWith("price_")) {
        return jsonResponse({ success: false, error: "price_id_required" }, 400);
      }

      const existingSlug = (body.existingStudioSlug as string | undefined)?.trim();
      const successUrl = (body.successUrl as string | undefined) ??
        `${WEB_ORIGIN}/admin?billing=success`;
      const cancelUrl = (body.cancelUrl as string | undefined) ??
        `${WEB_ORIGIN}/sales?billing=cancel`;

      let studio: Record<string, unknown>;

      if (existingSlug) {
        const row = await fetchStudioBySlug(supabase, existingSlug);
        if (!row) {
          return jsonResponse({ success: false, error: "studio_not_found" }, 404);
        }
        studio = row as Record<string, unknown>;
        await supabase
          .from("studio_branding")
          .update({ plan: "premium", updated_at: new Date().toISOString() })
          .eq("id", studio.id);
        studio.plan = "premium";
      } else {
        const studioName = (body.studioName as string | undefined)?.trim();
        const billingEmail = (body.billingEmail as string | undefined)?.trim().toLowerCase();
        const password = body.password as string | undefined;
        const requestedSlug = (body.studioSlug as string | undefined)?.trim();

        if (!studioName || studioName.length < 2) {
          return jsonResponse({ success: false, error: "studio_name_required" }, 400);
        }
        if (!billingEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
          return jsonResponse({ success: false, error: "email_required" }, 400);
        }
        if (!password || password.length < 8) {
          return jsonResponse({ success: false, error: "password_too_short" }, 400);
        }

        const slugBase = requestedSlug
          ? slugifyStudioName(requestedSlug)
          : slugifyStudioName(studioName);
        if (!slugBase || isReservedStudioSlug(slugBase)) {
          return jsonResponse({ success: false, error: "invalid_slug" }, 400);
        }

        const uniqueSlug = await ensureUniqueSlug(supabase, slugBase);
        const { data, error: insertError } = await supabase
          .from("studio_branding")
          .insert({
            admin_password_hash: hashPassword(password),
            studio_name: studioName,
            display_app_name: studioName,
            studio_slug: uniqueSlug,
            contact_email: billingEmail,
            billing_email: billingEmail,
            plan: "premium",
            subscription_status: "incomplete",
            primary_color: "#2E7D32",
            show_default_branding: true,
            show_landing_page: true,
            feature_config: DEFAULT_FEATURE_CONFIG,
          })
          .select()
          .single();

        if (insertError) {
          console.error("sales register error:", insertError);
          return jsonResponse({ success: false, error: "registration_failed" }, 500);
        }
        studio = data as Record<string, unknown>;
      }

      const slug = studio.studio_slug as string;
      const checkoutSuccess =
        `${WEB_ORIGIN}/admin?studio=${encodeURIComponent(slug)}&billing=success`;

      const outcome = await createCheckoutForStudio(
        studio,
        "premium",
        priceId,
        checkoutSuccess,
        cancelUrl,
        { skipTrial: true },
      );

      return jsonResponse({
        success: true,
        upgraded: outcome.upgraded,
        url: outcome.url,
        sessionId: outcome.sessionId,
        studioSlug: slug,
      });
    }

    const plan = body.plan as SubscriptionPlan | undefined;
    if (!plan || !["starter", "pro", "premium"].includes(plan)) {
      return jsonResponse({ success: false, error: "invalid_plan" }, 400);
    }

    const priceId = body.priceId as string | undefined ?? priceIdForPlan(plan);
    if (!priceId) {
      return jsonResponse({ success: false, error: "price_not_configured" }, 400);
    }

    const successUrl = (body.successUrl as string | undefined) ??
      `${WEB_ORIGIN}/admin?billing=success`;
    const cancelUrl = (body.cancelUrl as string | undefined) ??
      `${WEB_ORIGIN}/admin?billing=cancel`;

    if (action === "register-and-checkout") {
      const studioName = (body.studioName as string | undefined)?.trim();
      const billingEmail = (body.billingEmail as string | undefined)?.trim().toLowerCase();
      const password = body.password as string | undefined;
      const requestedSlug = (body.studioSlug as string | undefined)?.trim();

      if (!studioName || studioName.length < 2) {
        return jsonResponse({ success: false, error: "studio_name_required" }, 400);
      }
      if (!billingEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
        return jsonResponse({ success: false, error: "email_required" }, 400);
      }
      if (!password || password.length < 8) {
        return jsonResponse({ success: false, error: "password_too_short" }, 400);
      }

      const slugBase = requestedSlug
        ? slugifyStudioName(requestedSlug)
        : slugifyStudioName(studioName);
      if (!slugBase) {
        return jsonResponse({ success: false, error: "invalid_slug" }, 400);
      }
      if (isReservedStudioSlug(slugBase)) {
        return jsonResponse({ success: false, error: "reserved_slug" }, 400);
      }

      const uniqueSlug = await ensureUniqueSlug(supabase, slugBase);
      const passwordHash = hashPassword(password);

      const { data: studio, error: insertError } = await supabase
        .from("studio_branding")
        .insert({
          admin_password_hash: passwordHash,
          studio_name: studioName,
          display_app_name: studioName,
          studio_slug: uniqueSlug,
          contact_email: billingEmail,
          billing_email: billingEmail,
          plan,
          subscription_status: "incomplete",
          primary_color: "#2E7D32",
          show_default_branding: true,
          show_landing_page: true,
          feature_config: DEFAULT_FEATURE_CONFIG,
        })
        .select()
        .single();

      if (insertError) {
        console.error("register insert error:", insertError);
        return jsonResponse({ success: false, error: "registration_failed" }, 500);
      }

      const checkoutSuccess = `${WEB_ORIGIN}/admin?studio=${encodeURIComponent(uniqueSlug)}&billing=success`;
      const checkoutCancel = `${WEB_ORIGIN}/start?plan=${plan}&billing=cancel`;

      const outcome = await createCheckoutForStudio(
        studio as Record<string, unknown>,
        plan,
        priceId,
        checkoutSuccess,
        checkoutCancel,
      );

      return jsonResponse({
        success: true,
        upgraded: outcome.upgraded,
        url: outcome.url,
        sessionId: outcome.sessionId,
        studioSlug: uniqueSlug,
      });
    }

    if (action === "create-checkout-session") {
      const studioSlug = body.studioSlug as string | undefined;
      const password = body.password as string | undefined;
      const auth = await verifyStudioAdmin(supabase, studioSlug, password);
      if (!auth.ok) {
        return jsonResponse(
          { success: false, error: auth.error },
          auth.error === "invalid_password" ? 401 : 400,
        );
      }

      const outcome = await createCheckoutForStudio(
        auth.studio as Record<string, unknown>,
        plan,
        priceId,
        successUrl,
        cancelUrl,
      );

      return jsonResponse({
        success: true,
        upgraded: outcome.upgraded,
        url: outcome.url,
        sessionId: outcome.sessionId,
      });
    }

    return jsonResponse({ success: false, error: "unknown_action" }, 400);
  } catch (error) {
    console.error("stripe-checkout error:", error);
    const message = error instanceof Error ? error.message : "internal_error";
    return jsonResponse({ success: false, error: message }, 500);
  }
});
