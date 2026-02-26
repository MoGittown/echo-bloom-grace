
-- 1. Create a public view for studio_branding that excludes admin_password_hash
CREATE VIEW public.studio_branding_public
WITH (security_invoker = on) AS
SELECT id, studio_name, logo_url, primary_color, show_default_branding,
       show_landing_page, show_appointment_booking, show_manufacturer_field,
       landing_headline, landing_subheadline, landing_benefit_1, landing_benefit_2,
       landing_benefit_3, landing_cta_text, landing_why_text,
       contact_address, contact_phone, contact_email, contact_website,
       custom_manufacturers, enabled_manufacturers, created_at, updated_at
FROM public.studio_branding;

-- 2. Replace the open SELECT policy on studio_branding with one that denies direct access
DROP POLICY IF EXISTS "Anyone can read branding" ON public.studio_branding;
CREATE POLICY "Deny direct table access"
  ON public.studio_branding FOR SELECT
  USING (false);

-- 3. Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.studio_branding_public TO anon, authenticated;

-- 4. Remove public SELECT on appointment_requests (only INSERT is needed for customers)
DROP POLICY IF EXISTS "Anyone can read appointment requests" ON public.appointment_requests;
