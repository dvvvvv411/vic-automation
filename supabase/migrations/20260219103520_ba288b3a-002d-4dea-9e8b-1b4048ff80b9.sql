
-- 1. Make email and employment_type nullable on applications
ALTER TABLE public.applications ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.applications ALTER COLUMN employment_type DROP NOT NULL;

-- 2. Add is_indeed column
ALTER TABLE public.applications ADD COLUMN is_indeed boolean NOT NULL DEFAULT false;

-- 3. Create short_links table
CREATE TABLE public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  target_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Everyone can SELECT (needed for redirect)
CREATE POLICY "Anyone can select short_links"
  ON public.short_links FOR SELECT
  USING (true);

-- Admins can INSERT
CREATE POLICY "Admins can insert short_links"
  ON public.short_links FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Insert new SMS template for Indeed
INSERT INTO public.sms_templates (event_type, label, message)
VALUES (
  'indeed_bewerbung_angenommen',
  'Indeed Bewerbung angenommen',
  'Hallo {name}, vielen Dank fuer Ihre Bewerbung bei {unternehmen}, bitte buchen Sie ein Bewerbungsgespraech unter {link}.'
);
