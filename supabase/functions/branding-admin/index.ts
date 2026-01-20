import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for password (for demo - in production use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "kitchen-studio-salt-2025");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
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

    // Get existing branding
    const { data: existingBranding } = await supabase
      .from("studio_branding")
      .select("*")
      .limit(1)
      .single();

    switch (action) {
      case "verify": {
        // Verify admin password
        if (!existingBranding) {
          return new Response(
            JSON.stringify({ success: false, error: "no_branding_setup", needsSetup: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const isValid = await verifyPassword(password, existingBranding.admin_password_hash);
        return new Response(
          JSON.stringify({ success: isValid, branding: isValid ? existingBranding : null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "setup": {
        // Initial setup - only works if no branding exists
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

        return new Response(
          JSON.stringify({ success: true, branding: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        // Update branding - requires valid password
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

        const updateData: Record<string, unknown> = {};
        if (studioName !== undefined) updateData.studio_name = studioName;
        if (logoUrl !== undefined) updateData.logo_url = logoUrl;
        if (primaryColor !== undefined) updateData.primary_color = primaryColor;
        if (showDefaultBranding !== undefined) updateData.show_default_branding = showDefaultBranding;
        if (showAppointmentBooking !== undefined) updateData.show_appointment_booking = showAppointmentBooking;
        if (showManufacturerField !== undefined) updateData.show_manufacturer_field = showManufacturerField;
        if (customManufacturers !== undefined) updateData.custom_manufacturers = customManufacturers;
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

        return new Response(
          JSON.stringify({ success: true, branding: data }),
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
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
