import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabaseAdmin.ts";
import { verifyStudioAdmin } from "../_shared/studioAuth.ts";
import { getStripe } from "../_shared/stripeBilling.ts";

const WEB_ORIGIN = Deno.env.get("PUBLIC_WEB_URL") ?? "https://kuechenready.de";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "method_not_allowed" }, 405);
  }

  try {
    const body = await req.json();
    if (body.action !== "create-portal-session") {
      return jsonResponse({ success: false, error: "unknown_action" }, 400);
    }

    const studioSlug = body.studioSlug as string | undefined;
    const password = body.password as string | undefined;
    const returnUrl = (body.returnUrl as string | undefined) ?? `${WEB_ORIGIN}/admin`;

    const supabase = createServiceClient();
    const auth = await verifyStudioAdmin(supabase, studioSlug, password);
    if (!auth.ok) {
      return jsonResponse({ success: false, error: auth.error }, auth.error === "invalid_password" ? 401 : 400);
    }

    const customerId = auth.studio.stripe_customer_id as string | null;
    if (!customerId) {
      return jsonResponse({ success: false, error: "no_stripe_customer" }, 400);
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      locale: "de",
    });

    return jsonResponse({ success: true, url: session.url });
  } catch (error) {
    console.error("stripe-portal error:", error);
    const message = error instanceof Error ? error.message : "internal_error";
    return jsonResponse({ success: false, error: message }, 500);
  }
});
