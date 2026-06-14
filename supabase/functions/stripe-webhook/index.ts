import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabaseAdmin.ts";
import {
  getStripe,
  mapStripeSubscriptionStatus,
  resolvePlanFromSubscription,
  syncSubscriptionToStudio,
} from "../_shared/stripeBilling.ts";
import { graceEndsAtFromNow } from "../_shared/planAccess.ts";

async function resolveStudioSlug(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription,
  customerId: string | null,
): Promise<string | null> {
  if (subscription.metadata?.studio_slug) {
    return subscription.metadata.studio_slug;
  }
  if (customerId) {
    const { data } = await supabase
      .from("studio_branding")
      .select("studio_slug")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.studio_slug) return data.studio_slug as string;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "method_not_allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET missing");
    return jsonResponse({ error: "webhook_not_configured" }, 500);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse({ error: "missing_signature" }, 400);
  }

  const stripe = getStripe();
  const supabase = createServiceClient();
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return jsonResponse({ error: "invalid_signature" }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const studioSlug = session.metadata?.studio_slug;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

        if (studioSlug && customerId) {
          const patch: Record<string, unknown> = {
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          };
          if (session.metadata?.plan) patch.plan = session.metadata.plan;
          if (session.customer_details?.email) patch.billing_email = session.customer_details.email;

          await supabase.from("studio_branding").update(patch).eq("studio_slug", studioSlug);
        }

        if (subscriptionId && studioSlug) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionToStudio(supabase, studioSlug, subscription, customerId ?? undefined);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
        const studioSlug = await resolveStudioSlug(supabase, subscription, customerId);
        if (studioSlug) {
          await syncSubscriptionToStudio(supabase, studioSlug, subscription, customerId);
        } else {
          console.warn("subscription event without studio_slug", subscription.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
        const studioSlug = await resolveStudioSlug(supabase, subscription, customerId);
        if (studioSlug) {
          await supabase
            .from("studio_branding")
            .update({
              subscription_status: "canceled",
              stripe_subscription_id: null,
              trial_ends_at: null,
              billing_grace_ends_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("studio_slug", studioSlug);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? null;
        if (customerId) {
          await supabase
            .from("studio_branding")
            .update({
              subscription_status: "past_due",
              billing_grace_ends_at: graceEndsAtFromNow(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id ?? null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
          const studioSlug = await resolveStudioSlug(supabase, subscription, customerId);
          if (studioSlug) {
            const plan = resolvePlanFromSubscription(subscription);
            await supabase
              .from("studio_branding")
              .update({
                subscription_status: mapStripeSubscriptionStatus(subscription.status),
                plan: plan ?? undefined,
                billing_grace_ends_at: null,
                updated_at: new Date().toISOString(),
              })
              .eq("studio_slug", studioSlug);
          }
        }
        break;
      }

      default:
        break;
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("stripe-webhook handler error:", error);
    return jsonResponse({ error: "handler_failed" }, 500);
  }
});
