
-- Create applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  street text,
  zip_code text,
  city text,
  employment_type text NOT NULL CHECK (employment_type IN ('minijob', 'teilzeit', 'vollzeit')),
  branding_id uuid REFERENCES public.brandings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can select applications"
  ON public.applications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert applications"
  ON public.applications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update applications"
  ON public.applications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications"
  ON public.applications FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
