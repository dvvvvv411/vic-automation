CREATE TABLE public.phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage phone_numbers"
  ON public.phone_numbers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));