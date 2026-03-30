-- Fix RLS policies for first_workday_appointments to include contract_id lookups for kunde/caller

DROP POLICY "Admins can select first_workday_appointments" ON public.first_workday_appointments;
CREATE POLICY "Admins can select first_workday_appointments"
ON public.first_workday_appointments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
  OR (is_caller(auth.uid()) AND (
    application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
);

DROP POLICY "Admins can update first_workday_appointments" ON public.first_workday_appointments;
CREATE POLICY "Admins can update first_workday_appointments"
ON public.first_workday_appointments FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
  OR (is_caller(auth.uid()) AND (
    application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
);

DROP POLICY "Admins can delete first_workday_appointments" ON public.first_workday_appointments;
CREATE POLICY "Admins can delete first_workday_appointments"
ON public.first_workday_appointments FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
  OR (is_caller(auth.uid()) AND (
    application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
);

DROP POLICY "Admins can insert first_workday_appointments" ON public.first_workday_appointments;
CREATE POLICY "Admins can insert first_workday_appointments"
ON public.first_workday_appointments FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_kunde(auth.uid())
  OR is_caller(auth.uid())
);