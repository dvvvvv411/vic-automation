DROP POLICY "Admins can insert short_links" ON public.short_links;
CREATE POLICY "Admins and Kunden can insert short_links"
  ON public.short_links FOR INSERT
  TO public
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_kunde(auth.uid())
  );