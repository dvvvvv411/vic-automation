CREATE TABLE public.branding_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  page_context text NOT NULL,
  content text NOT NULL,
  author_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.branding_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read branding_notes" ON public.branding_notes
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))) OR
    (is_caller(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid())))
  );

CREATE POLICY "Users can insert branding_notes" ON public.branding_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()) OR is_caller(auth.uid())
  );

CREATE POLICY "Users can delete own branding_notes" ON public.branding_notes
  FOR DELETE TO authenticated
  USING (
    author_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );