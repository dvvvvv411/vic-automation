
-- Create brandings table
CREATE TABLE public.brandings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  company_name text NOT NULL,
  street text,
  zip_code text,
  city text,
  trade_register text,
  register_court text,
  managing_director text,
  vat_id text,
  domain text,
  email text,
  brand_color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brandings ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can read
CREATE POLICY "Admins can select brandings"
ON public.brandings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can insert
CREATE POLICY "Admins can insert brandings"
ON public.brandings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can update
CREATE POLICY "Admins can update brandings"
ON public.brandings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can delete
CREATE POLICY "Admins can delete brandings"
ON public.brandings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for branding logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding-logos', 'branding-logos', true);

-- Storage policies: admins can upload
CREATE POLICY "Admins can upload branding logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies: public read
CREATE POLICY "Branding logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding-logos');

-- Storage policies: admins can update
CREATE POLICY "Admins can update branding logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies: admins can delete
CREATE POLICY "Admins can delete branding logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));
