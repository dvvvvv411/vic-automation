
-- Update RLS policies for applications to include caller
DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
CREATE POLICY "Admins can select applications" ON public.applications FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))));

DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))));

-- Update RLS for interview_appointments
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
CREATE POLICY "Admins can select appointments" ON public.interview_appointments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (application_id IN (SELECT apps_for_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid())))));

DROP POLICY IF EXISTS "Admins can update appointments" ON public.interview_appointments;
CREATE POLICY "Admins can update appointments" ON public.interview_appointments FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (application_id IN (SELECT apps_for_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid())))));

DROP POLICY IF EXISTS "Admins can insert appointments" ON public.interview_appointments;
CREATE POLICY "Admins can insert appointments" ON public.interview_appointments FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()) OR is_caller(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.interview_appointments;
CREATE POLICY "Admins can delete appointments" ON public.interview_appointments FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (application_id IN (SELECT apps_for_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid())))));

-- Update RLS for trial_day_appointments
DROP POLICY IF EXISTS "Admins can select trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Admins can manage trial_day_appointments" ON public.trial_day_appointments;
-- Check existing policies first - trial_day has similar pattern
CREATE POLICY "Caller can select trial_day_appointments" ON public.trial_day_appointments FOR SELECT TO authenticated
USING (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid()))));

CREATE POLICY "Caller can update trial_day_appointments" ON public.trial_day_appointments FOR UPDATE TO authenticated
USING (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid()))));

CREATE POLICY "Caller can insert trial_day_appointments" ON public.trial_day_appointments FOR INSERT TO authenticated
WITH CHECK (is_caller(auth.uid()));

CREATE POLICY "Caller can delete trial_day_appointments" ON public.trial_day_appointments FOR DELETE TO authenticated
USING (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid()))));

-- Update RLS for employment_contracts (read only for caller)
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (user_id = auth.uid()) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))));

-- Update RLS for brandings (read only for caller)
DROP POLICY IF EXISTS "Admins can select brandings" ON public.brandings;
CREATE POLICY "Admins can select brandings" ON public.brandings FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (id IN (SELECT user_branding_ids(auth.uid())))) OR user_can_read_branding(id, auth.uid()));

-- Update RLS for branding_schedule_settings (read for caller)
DROP POLICY IF EXISTS "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings;
CREATE POLICY "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()) OR is_caller(auth.uid()));

-- Update RLS for schedule_blocked_slots
DROP POLICY IF EXISTS "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots;
CREATE POLICY "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()) OR is_caller(auth.uid()));

-- Caller can read own kunde_brandings
DROP POLICY IF EXISTS "Kunden can read own kunde_brandings" ON public.kunde_brandings;
CREATE POLICY "Kunden and callers can read own kunde_brandings" ON public.kunde_brandings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Caller can read own admin_permissions
-- Already covered by "Users can read own permissions" policy

-- Caller can read email_logs for sending emails
DROP POLICY IF EXISTS "Admins can select email_logs" ON public.email_logs;
CREATE POLICY "Admins can select email_logs" ON public.email_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))));

-- Caller can view profiles (needed for sidebar etc)
CREATE POLICY "Callers can view profiles" ON public.profiles FOR SELECT TO authenticated
USING (is_caller(auth.uid()));
