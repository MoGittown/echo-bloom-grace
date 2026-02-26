import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Legacy hash function - only used for migration from old SHA-256 hashes
async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "kitchen-studio-salt-2025");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function isLegacyHash(hash: string): boolean {
  // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 chars
  // SHA-256 hex hashes are exactly 64 hex characters
  return /^[a-f0-9]{64}$/.test(hash);
}

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isLegacyHash(hash)) {
    // Verify against legacy SHA-256 hash
    const legacyHash = await legacyHashPassword(password);
    return legacyHash === hash;
  }
  return await bcrypt.compare(password, hash);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      action, 
      password, 
      newPassword, 
      studioName, 
      logoUrl, 
      primaryColor, 
      showDefaultBranding,
      showAppointmentBooking,
      showManufacturerField,
      customManufacturers,
      enabledManufacturers,
      landingHeadline,
      landingSubheadline,
      landingBenefit1,
      landingBenefit2,
      landingBenefit3,
      landingCtaText,
      landingWhyText,
      showLandingPage,
      contactAddress,
      contactPhone,
      contactEmail,
      contactWebsite
    } = await req.json();

    // Get existing branding (service role bypasses RLS)
    const { data: existingBranding } = await supabase
      .from("studio_branding")
      .select("*")
      .limit(1)
      .single();

    switch (action) {
      case "verify": {
        if (!existingBranding) {
          return new Response(
            JSON.stringify({ success: false, error: "no_branding_setup", needsSetup: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const isValid = await verifyPassword(password, existingBranding.admin_password_hash);
        
        // If valid and using legacy hash, upgrade to bcrypt transparently
        if (isValid && isLegacyHash(existingBranding.admin_password_hash)) {
          const newHash = await hashPassword(password);
          await supabase
            .from("studio_branding")
            .update({ admin_password_hash: newHash })
            .eq("id", existingBranding.id);
        }

        // Strip admin_password_hash from response
        if (isValid && existingBranding) {
          const { admin_password_hash: _, ...safeBranding } = existingBranding;
          return new Response(
            JSON.stringify({ success: true, branding: safeBranding }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "setup": {
        if (existingBranding) {
          return new Response(
            JSON.stringify({ success: false, error: "already_setup" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        if (!password || password.length < 6) {
          return new Response(
            JSON.stringify({ success: false, error: "password_too_short" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        const passwordHash = await hashPassword(password);
        const { data, error } = await supabase
          .from("studio_branding")
          .insert({
            admin_password_hash: passwordHash,
            studio_name: studioName || "",
            logo_url: logoUrl || null,
            primary_color: primaryColor || "#8B7355",
            show_default_branding: showDefaultBranding ?? true,
          })
          .select()
          .single();

        if (error) throw error;

        // Strip admin_password_hash from response
        const { admin_password_hash: _, ...safeBranding } = data;
        return new Response(
          JSON.stringify({ success: true, branding: safeBranding }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!existingBranding) {
          return new Response(
            JSON.stringify({ success: false, error: "no_branding_setup" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        const isValid = await verifyPassword(password, existingBranding.admin_password_hash);
        if (!isValid) {
          return new Response(
            JSON.stringify({ success: false, error: "invalid_password" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
          );
        }

        // If using legacy hash, upgrade transparently
        if (isLegacyHash(existingBranding.admin_password_hash)) {
          const newHash = await hashPassword(password);
          await supabase
            .from("studio_branding")
            .update({ admin_password_hash: newHash })
            .eq("id", existingBranding.id);
        }

        const updateData: Record<string, unknown> = {};
        if (studioName !== undefined) updateData.studio_name = studioName;
        if (logoUrl !== undefined) updateData.logo_url = logoUrl;
        if (primaryColor !== undefined) updateData.primary_color = primaryColor;
        if (showDefaultBranding !== undefined) updateData.show_default_branding = showDefaultBranding;
        if (showAppointmentBooking !== undefined) updateData.show_appointment_booking = showAppointmentBooking;
        if (showManufacturerField !== undefined) updateData.show_manufacturer_field = showManufacturerField;
        if (customManufacturers !== undefined) updateData.custom_manufacturers = customManufacturers;
        if (enabledManufacturers !== undefined) updateData.enabled_manufacturers = enabledManufacturers;
        if (landingHeadline !== undefined) updateData.landing_headline = landingHeadline;
        if (landingSubheadline !== undefined) updateData.landing_subheadline = landingSubheadline;
        if (landingBenefit1 !== undefined) updateData.landing_benefit_1 = landingBenefit1;
        if (landingBenefit2 !== undefined) updateData.landing_benefit_2 = landingBenefit2;
        if (landingBenefit3 !== undefined) updateData.landing_benefit_3 = landingBenefit3;
        if (landingCtaText !== undefined) updateData.landing_cta_text = landingCtaText;
        if (landingWhyText !== undefined) updateData.landing_why_text = landingWhyText;
        if (showLandingPage !== undefined) updateData.show_landing_page = showLandingPage;
        if (contactAddress !== undefined) updateData.contact_address = contactAddress;
        if (contactPhone !== undefined) updateData.contact_phone = contactPhone;
        if (contactEmail !== undefined) updateData.contact_email = contactEmail;
        if (contactWebsite !== undefined) updateData.contact_website = contactWebsite;
        
        // Handle password change
        if (newPassword && newPassword.length >= 6) {
          updateData.admin_password_hash = await hashPassword(newPassword);
        }

        const { data, error } = await supabase
          .from("studio_branding")
          .update(updateData)
          .eq("id", existingBranding.id)
          .select()
          .single();

        if (error) throw error;

        // Strip admin_password_hash from response
        const { admin_password_hash: _, ...safeBranding } = data;
        return new Response(
          JSON.stringify({ success: true, branding: safeBranding }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Branding admin error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
