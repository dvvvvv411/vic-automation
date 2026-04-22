DROP POLICY IF EXISTS "Admins and Kunden can insert short_links" ON public.short_links;

CREATE POLICY "Admins, Kunden and Caller can insert short_links"
  ON public.short_links FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_kunde(auth.uid())
    OR is_caller(auth.uid())
  );