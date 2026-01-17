-- Add setting to enable/disable appointment requests in studio_branding
ALTER TABLE public.studio_branding 
ADD COLUMN IF NOT EXISTS show_appointment_booking boolean DEFAULT false;

-- Create table for appointment requests
CREATE TABLE public.appointment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  requested_date date NOT NULL,
  requested_time text NOT NULL,
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert appointment requests (public form)
CREATE POLICY "Anyone can create appointment requests"
ON public.appointment_requests
FOR INSERT
WITH CHECK (true);

-- Only authenticated users (studio admin) can view/update requests
-- For now, we allow public read since there's no auth system
CREATE POLICY "Anyone can read appointment requests"
ON public.appointment_requests
FOR SELECT
USING (true);