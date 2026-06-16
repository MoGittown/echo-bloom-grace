import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@17.5.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabaseAdmin.ts";
import {
  getStripe,
  mapStripeSubscriptionStatus,
  resolvePlanFromSubscription,
  syncSubscriptionToStudio,
} from "../_shared/stripeBilling.ts";
import { graceEndsAtFromNow } from "../_shared/planAccess.ts";
import {
  sendCancellationEmail,
  sendOperatorNewSubscriptionEmail,
  sendPaymentFailedEmail,
  sendRenewalReminderEmail,
  sendStudioWelcomeEmail,
  type StudioContact,
} from "../_shared/billingEmails.ts";

type StudioContactRow = StudioContact & { studioSlug: string | null };

/** Lädt die Kontaktdaten eines Studios (für Mails) per Slug oder Customer-ID. */
async function fetchStudioContact(
  supabase: ReturnType<typeof createServiceClient>,
  by: { slug?: string | null; customerId?: string | null },
): Promise<StudioContactRow | null> {
  let query = supabase
    .from("studio_branding")
    .select("studio_name, display_app_name, billing_email, contact_email, plan, studio_slug");
  if (by.slug) {
    query = query.eq("studio_slug", by.slug);
  } else if (by.customerId) {
    query = query.eq("stripe_customer_id", by.customerId);
  } else {
    return null;
  }
  const { data } = await query.maybeSingle();
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return {
    studioName: (r.display_app_name as string | null) || (r.studio_name as string | null) || null,
    email: (r.billing_email as string | null) || (r.contact_email as string | null) || null,
    plan: (r.plan as string | null) ?? null,
    studioSlug: (r.studio_slug as string | null) ?? null,
  };
}

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

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();
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

        // E-Mails: Willkommen ans Studio + Benachrichtigung an den Betreiber.
        if (studioSlug) {
          const contact = await fetchStudioContact(supabase, { slug: studioSlug });
          if (contact) {
            await sendStudioWelcomeEmail(contact);
            await sendOperatorNewSubscriptionEmail(contact);
          }
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
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq("studio_slug", studioSlug);

          const contact = await fetchStudioContact(supabase, { slug: studioSlug });
          if (contact) await sendCancellationEmail(contact);
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

          const contact = await fetchStudioContact(supabase, { customerId });
          if (contact) await sendPaymentFailedEmail(contact);
        }
        break;
      }

      case "invoice.upcoming": {
        // Erinnerung ~1 Woche vor Verlängerung (Vorlauf wird in Stripe konfiguriert).
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? null;
        if (customerId) {
          const contact = await fetchStudioContact(supabase, { customerId });
          if (contact) {
            const renewalUnix = invoice.next_payment_attempt ?? invoice.period_end ?? null;
            const renewalDate = renewalUnix
              ? new Date(renewalUnix * 1000).toISOString()
              : null;
            const amountText = typeof invoice.amount_due === "number"
              ? `${(invoice.amount_due / 100).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} ${(invoice.currency ?? "eur").toUpperCase()}`
              : null;
            await sendRenewalReminderEmail(contact, { renewalDate, amountText });
          }
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
