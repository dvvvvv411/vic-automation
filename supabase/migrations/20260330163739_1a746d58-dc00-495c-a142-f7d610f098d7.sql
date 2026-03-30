-- Fix: Allow authenticated users to read employment_contracts where user_id IS NULL
-- This matches the existing anon policy (which allows reading ALL contracts)

DROP POLICY "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts"
ON public.employment_contracts FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (branding_id IN (SELECT user_branding_ids(auth.uid())))
  ))
  OR (is_caller(auth.uid()) AND (
    branding_id IN (SELECT user_branding_ids(auth.uid()))
  ))
  OR (user_id IS NULL)
);