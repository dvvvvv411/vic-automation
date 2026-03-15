
-- Phase 1: Add branding_id columns to tables that need them
ALTER TABLE public.phone_numbers ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.orders ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.chat_templates ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.sms_spoof_templates ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.sms_spoof_logs ADD COLUMN branding_id uuid REFERENCES public.brandings(id);

-- Phase 2: Create helper function
CREATE OR REPLACE FUNCTION public.user_has_any_branding(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.kunde_brandings WHERE user_id = _user_id)
$$;

-- =====================================================
-- REWRITE ALL RLS POLICIES
-- =====================================================

-- =====================================================
-- TABLE: brandings
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete brandings" ON public.brandings;
DROP POLICY IF EXISTS "Admins can insert brandings" ON public.brandings;
DROP POLICY IF EXISTS "Admins can select brandings" ON public.brandings;
DROP POLICY IF EXISTS "Admins can update brandings" ON public.brandings;
DROP POLICY IF EXISTS "Kunden can select own brandings" ON public.brandings;
-- Keep: "Anon can select brandings", "Users can read assigned branding"

CREATE POLICY "Admins can insert brandings" ON public.brandings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select brandings" ON public.brandings FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can update brandings" ON public.brandings FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can delete brandings" ON public.brandings FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND (
      NOT user_has_any_branding(auth.uid())
      OR id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: applications
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Kunden can select own applications" ON public.applications;
-- Keep: "Anon can select applications", "Users can read own application"

CREATE POLICY "Admins can insert applications" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select applications" ON public.applications FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can delete applications" ON public.applications FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: branding_schedule_settings
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage branding_schedule_settings" ON public.branding_schedule_settings;
DROP POLICY IF EXISTS "Kunden can manage own branding_schedule_settings" ON public.branding_schedule_settings;
-- Keep: "Anon can read branding_schedule_settings"

CREATE POLICY "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: schedule_blocked_slots
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage schedule_blocked_slots" ON public.schedule_blocked_slots;
DROP POLICY IF EXISTS "Kunden can manage own schedule_blocked_slots" ON public.schedule_blocked_slots;
-- Keep: "Anon can read schedule_blocked_slots"

CREATE POLICY "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: trial_day_blocked_slots
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage trial_day_blocked_slots" ON public.trial_day_blocked_slots;
DROP POLICY IF EXISTS "Kunden can manage own trial_day_blocked_slots" ON public.trial_day_blocked_slots;

CREATE POLICY "Authenticated can manage trial_day_blocked_slots" ON public.trial_day_blocked_slots FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: order_appointment_blocked_slots
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots;
DROP POLICY IF EXISTS "Kunden can manage own order_appointment_blocked_slots" ON public.order_appointment_blocked_slots;
-- Keep: "Authenticated users can read order_appointment_blocked_slots"

CREATE POLICY "Authenticated can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: phone_numbers (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage phone_numbers" ON public.phone_numbers;
DROP POLICY IF EXISTS "Kunden can manage own phone_numbers" ON public.phone_numbers;

CREATE POLICY "Authenticated can manage phone_numbers" ON public.phone_numbers FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: orders (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can select orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Kunden can select own orders" ON public.orders;
-- Keep: "Users can select assigned orders"

CREATE POLICY "Admins can insert orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select orders" ON public.orders FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: chat_templates (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Admins can insert chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Admins can select chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Admins can update chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Kunden can select own chat_templates" ON public.chat_templates;

CREATE POLICY "Authenticated can manage chat_templates" ON public.chat_templates FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: sms_spoof_templates (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage sms_spoof_templates" ON public.sms_spoof_templates;
DROP POLICY IF EXISTS "Kunden can manage own sms_spoof_templates" ON public.sms_spoof_templates;

CREATE POLICY "Authenticated can manage sms_spoof_templates" ON public.sms_spoof_templates FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: sms_spoof_logs (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert sms_spoof_logs" ON public.sms_spoof_logs;
DROP POLICY IF EXISTS "Admins can select all sms_spoof_logs" ON public.sms_spoof_logs;
DROP POLICY IF EXISTS "Kunden can insert own sms_spoof_logs" ON public.sms_spoof_logs;
DROP POLICY IF EXISTS "Kunden can select own sms_spoof_logs" ON public.sms_spoof_logs;

CREATE POLICY "Authenticated can insert sms_spoof_logs" ON public.sms_spoof_logs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Authenticated can select sms_spoof_logs" ON public.sms_spoof_logs FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: interview_appointments (indirect via application_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Admins can insert appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Kunden can select own appointments" ON public.interview_appointments;
-- Keep: "Anyone can book appointments", "Anyone can view appointments"

CREATE POLICY "Admins can insert appointments" ON public.interview_appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select appointments" ON public.interview_appointments FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can update appointments" ON public.interview_appointments FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can delete appointments" ON public.interview_appointments FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

-- =====================================================
-- TABLE: trial_day_appointments (indirect via application_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Admins can insert trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Admins can select trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Admins can update trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Kunden can select own trial_day_appointments" ON public.trial_day_appointments;

CREATE POLICY "Admins can insert trial_day_appointments" ON public.trial_day_appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select trial_day_appointments" ON public.trial_day_appointments FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can update trial_day_appointments" ON public.trial_day_appointments FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can delete trial_day_appointments" ON public.trial_day_appointments FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

-- =====================================================
-- TABLE: employment_contracts (indirect via application_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Admins can insert employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Admins can update employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Kunden can select own employment_contracts" ON public.employment_contracts;
-- Keep: "Anon can select/update own contract by application", "Users can select/update own employment_contract"

CREATE POLICY "Admins can insert employment_contracts" ON public.employment_contracts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

-- =====================================================
-- TABLE: chat_messages (indirect via contract_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can select chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can update chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Kunden can select own chat_messages" ON public.chat_messages;
-- Keep: "Users can insert own chat_messages", "Users can mark admin messages as read", "Users can select own chat_messages"

CREATE POLICY "Admins can insert chat_messages" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select chat_messages" ON public.chat_messages FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can update chat_messages" ON public.chat_messages FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

-- =====================================================
-- TABLE: order_assignments (indirect via contract_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Admins can insert order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Admins can select order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Admins can update order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Kunden can select own order_assignments" ON public.order_assignments;
-- Keep: "Users can insert own assignments from chat offers", "Users can select own assignments", "Users can update own assignments"

CREATE POLICY "Admins can insert order_assignments" ON public.order_assignments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select order_assignments" ON public.order_assignments FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can update order_assignments" ON public.order_assignments FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can delete order_assignments" ON public.order_assignments FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

-- =====================================================
-- TABLE: order_reviews (indirect via contract_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins and Kunden can delete order_reviews" ON public.order_reviews;
DROP POLICY IF EXISTS "Admins can select order_reviews" ON public.order_reviews;
DROP POLICY IF EXISTS "Kunden can select own order_reviews" ON public.order_reviews;
-- Keep: "Users can insert own order_reviews", "Users can select own order_reviews"

CREATE POLICY "Admins can select order_reviews" ON public.order_reviews FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can delete order_reviews" ON public.order_reviews FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

-- =====================================================
-- TABLE: order_appointments (indirect via contract_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete order_appointments" ON public.order_appointments;
DROP POLICY IF EXISTS "Admins can insert order_appointments_admin" ON public.order_appointments;
DROP POLICY IF EXISTS "Admins can select order_appointments" ON public.order_appointments;
DROP POLICY IF EXISTS "Admins can update order_appointments" ON public.order_appointments;
DROP POLICY IF EXISTS "Kunden can select own order_appointments" ON public.order_appointments;
-- Keep: "Users can insert own order_appointments", "Users can select own order_appointments"

CREATE POLICY "Admins can insert order_appointments" ON public.order_appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select order_appointments" ON public.order_appointments FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can update order_appointments" ON public.order_appointments FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can delete order_appointments" ON public.order_appointments FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

-- =====================================================
-- TABLE: email_logs — add branding-based filtering for kunden
-- =====================================================
DROP POLICY IF EXISTS "Kunden can select email_logs" ON public.email_logs;

CREATE POLICY "Kunden can select email_logs" ON public.email_logs FOR SELECT TO authenticated
  USING (
    is_kunde(auth.uid())
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: sms_logs — add branding-based filtering for kunden
-- =====================================================
DROP POLICY IF EXISTS "Admins can select sms_logs" ON public.sms_logs;

CREATE POLICY "Admins can select sms_logs" ON public.sms_logs FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );
