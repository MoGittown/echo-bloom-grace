-- Add contact details fields to studio_branding
ALTER TABLE public.studio_branding
ADD COLUMN contact_address TEXT DEFAULT NULL,
ADD COLUMN contact_phone TEXT DEFAULT NULL,
ADD COLUMN contact_email TEXT DEFAULT NULL,
ADD COLUMN contact_website TEXT DEFAULT NULL;