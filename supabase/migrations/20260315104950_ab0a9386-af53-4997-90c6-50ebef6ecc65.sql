
-- 1) Create 3 SECURITY DEFINER functions to break circular RLS dependencies

CREATE OR REPLACE FUNCTION public.user_application_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT application_id FROM public.employment_contracts WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.apps_for_branding_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.applications
  WHERE branding_id IN (SELECT public.user_branding_ids(_user_id));
$$;

CREATE OR REPLACE FUNCTION public.contracts_for_branding_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ec.id FROM public.employment_contracts ec
  JOIN public.applications a ON a.id = ec.application_id
  WHERE a.branding_id IN (SELECT public.user_branding_ids(_user_id));
$$;

-- 2) Fix applications: "Users can read own application" (breaks the recursion)
DROP POLICY IF EXISTS "Users can read own application" ON public.applications;
CREATE POLICY "Users can read own application" ON public.applications
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_application_ids(auth.uid())));

-- 3) Fix employment_contracts (SELECT, UPDATE, DELETE) - Kunde part uses apps_for_branding_ids
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (user_id = auth.uid())
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own employment_contract" ON public.employment_contracts;

DROP POLICY IF EXISTS "Admins can update employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (user_id = auth.uid())
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can update own employment_contract" ON public.employment_contracts;

DROP POLICY IF EXISTS "Admins can delete employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

-- 4) Fix interview_appointments (SELECT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
CREATE POLICY "Admins can select appointments" ON public.interview_appointments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can update appointments" ON public.interview_appointments;
CREATE POLICY "Admins can update appointments" ON public.interview_appointments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.interview_appointments;
CREATE POLICY "Admins can delete appointments" ON public.interview_appointments
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

-- 5) Fix trial_day_appointments (SELECT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can delete trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can delete trial_day_appointments" ON public.trial_day_appointments
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can select trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can select trial_day_appointments" ON public.trial_day_appointments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can update trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can update trial_day_appointments" ON public.trial_day_appointments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

-- 6) Fix chat_messages (SELECT, UPDATE) - uses contracts_for_branding_ids
DROP POLICY IF EXISTS "Admins can select chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can select chat_messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own chat_messages" ON public.chat_messages;

DROP POLICY IF EXISTS "Admins can update chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can update chat_messages" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can mark admin messages as read" ON public.chat_messages;

-- 7) Fix order_appointments (SELECT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can select order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can select order_appointments" ON public.order_appointments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own order_appointments" ON public.order_appointments;

DROP POLICY IF EXISTS "Admins can update order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can update order_appointments" ON public.order_appointments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can delete order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can delete order_appointments" ON public.order_appointments
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

-- 8) Fix order_assignments (SELECT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can select order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can select order_assignments" ON public.order_assignments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own assignments" ON public.order_assignments;

DROP POLICY IF EXISTS "Admins can update order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can update order_assignments" ON public.order_assignments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can update own assignments" ON public.order_assignments;

DROP POLICY IF EXISTS "Admins can delete order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can delete order_assignments" ON public.order_assignments
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

-- 9) Fix order_reviews (SELECT, DELETE)
DROP POLICY IF EXISTS "Admins can select order_reviews" ON public.order_reviews;
CREATE POLICY "Admins can select order_reviews" ON public.order_reviews
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own order_reviews" ON public.order_reviews;

DROP POLICY IF EXISTS "Admins can delete order_reviews" ON public.order_reviews;
CREATE POLICY "Admins can delete order_reviews" ON public.order_reviews
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );
