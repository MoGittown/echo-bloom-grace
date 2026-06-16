import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabaseAdmin.ts";
import { verifyStudioAdmin } from "../_shared/studioAuth.ts";

/**
 * Plattform-Betreiber-Übersicht.
 *
 * Sicherheit: Es wird (1) das übergebene Studio-Passwort gegen den Slug geprüft
 * UND (2) ob genau dieses Studio `is_platform_admin = true` hat. Nur dann werden
 * die Daten ALLER Studios mit Service-Role-Rechten zurückgegeben – sonst 403.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "method_not_allowed" }, 405);
  }

  try {
    const body = await req.json();
    const studioSlug = (body.studioSlug as string | undefined)?.trim();
    const password = body.password as string | undefined;

    const supabase = createServiceClient();
    const auth = await verifyStudioAdmin(supabase, studioSlug, password);
    if (!auth.ok) {
      return jsonResponse(
        { success: false, error: auth.error },
        auth.error === "invalid_password" ? 401 : 400,
      );
    }

    if (auth.studio.is_platform_admin !== true) {
      return jsonResponse({ success: false, error: "not_platform_admin" }, 403);
    }

    const { data, error } = await supabase
      .from("studio_branding")
      .select(
        "studio_name, display_app_name, studio_slug, plan, subscription_status, " +
          "subscribed_at, trial_ends_at, current_period_end, billing_grace_ends_at, " +
          "billing_email, contact_email, is_platform_admin, created_at",
      )
      .order("created_at", { ascending: true });

    if (error) throw error;

    const studios = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        studioName: (r.display_app_name as string | null) ||
          (r.studio_name as string | null) || "—",
        studioSlug: (r.studio_slug as string | null) ?? null,
        plan: (r.plan as string | null) ?? null,
        subscriptionStatus: (r.subscription_status as string | null) ?? "legacy",
        subscribedAt: (r.subscribed_at as string | null) ?? null,
        trialEndsAt: (r.trial_ends_at as string | null) ?? null,
        currentPeriodEnd: (r.current_period_end as string | null) ?? null,
        billingGraceEndsAt: (r.billing_grace_ends_at as string | null) ?? null,
        billingEmail: (r.billing_email as string | null) ??
          (r.contact_email as string | null) ?? null,
        isPlatformAdmin: r.is_platform_admin === true,
        createdAt: (r.created_at as string | null) ?? null,
      };
    });

    return jsonResponse({ success: true, studios });
  } catch (error) {
    console.error("platform-overview error:", error);
    const message = error instanceof Error ? error.message : "internal_error";
    return jsonResponse({ success: false, error: message }, 500);
  }
});
