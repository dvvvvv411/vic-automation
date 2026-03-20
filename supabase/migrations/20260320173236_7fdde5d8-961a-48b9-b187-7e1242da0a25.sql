-- Add SELECT policy for admin/kunde on trial_day_appointments
CREATE POLICY "Admin kunde can select trial_day_appointments"
ON public.trial_day_appointments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    )
  )
);