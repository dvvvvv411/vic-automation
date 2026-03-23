DROP POLICY "Users can delete own branding_notes" ON public.branding_notes;

CREATE POLICY "Users can delete branding_notes" ON public.branding_notes
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid()))))
    OR (is_caller(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid())))
  );