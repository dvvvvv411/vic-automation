
-- ============================================================
-- Fix: Admins bypass RLS completely, branding check only for Kunden
-- ============================================================

-- ==================== APPLICATIONS ====================
DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
CREATE POLICY "Admins can select applications" ON public.applications
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "Admins can update applications" ON public.applications
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
CREATE POLICY "Admins can delete applications" ON public.applications
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- ==================== EMPLOYMENT_CONTRACTS ====================
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== INTERVIEW_APPOINTMENTS ====================
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
CREATE POLICY "Admins can select appointments" ON public.interview_appointments
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update appointments" ON public.interview_appointments;
CREATE POLICY "Admins can update appointments" ON public.interview_appointments
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.interview_appointments;
CREATE POLICY "Admins can delete appointments" ON public.interview_appointments
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== TRIAL_DAY_APPOINTMENTS ====================
DROP POLICY IF EXISTS "Admins can delete trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can delete trial_day_appointments" ON public.trial_day_appointments
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- Also fix SELECT and UPDATE if they exist with old pattern
DROP POLICY IF EXISTS "Admins can select trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can select trial_day_appointments" ON public.trial_day_appointments
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can update trial_day_appointments" ON public.trial_day_appointments
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== CHAT_MESSAGES ====================
DROP POLICY IF EXISTS "Admins can select chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can select chat_messages" ON public.chat_messages
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can update chat_messages" ON public.chat_messages
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== ORDER_ASSIGNMENTS ====================
DROP POLICY IF EXISTS "Admins can select order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can select order_assignments" ON public.order_assignments
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can update order_assignments" ON public.order_assignments
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can delete order_assignments" ON public.order_assignments
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== ORDER_REVIEWS ====================
DROP POLICY IF EXISTS "Admins can select order_reviews" ON public.order_reviews;
CREATE POLICY "Admins can select order_reviews" ON public.order_reviews
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete order_reviews" ON public.order_reviews;
CREATE POLICY "Admins can delete order_reviews" ON public.order_reviews
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== ORDER_APPOINTMENTS ====================
DROP POLICY IF EXISTS "Admins can select order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can select order_appointments" ON public.order_appointments
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can update order_appointments" ON public.order_appointments
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can delete order_appointments" ON public.order_appointments
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== ORDERS ====================
DROP POLICY IF EXISTS "Admins can select orders" ON public.orders;
CREATE POLICY "Admins can select orders" ON public.orders
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- ==================== PHONE_NUMBERS ====================
DROP POLICY IF EXISTS "Authenticated can manage phone_numbers" ON public.phone_numbers;
CREATE POLICY "Authenticated can manage phone_numbers" ON public.phone_numbers
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== CHAT_TEMPLATES ====================
DROP POLICY IF EXISTS "Authenticated can manage chat_templates" ON public.chat_templates;
CREATE POLICY "Authenticated can manage chat_templates" ON public.chat_templates
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== SMS_SPOOF_TEMPLATES ====================
DROP POLICY IF EXISTS "Authenticated can manage sms_spoof_templates" ON public.sms_spoof_templates;
CREATE POLICY "Authenticated can manage sms_spoof_templates" ON public.sms_spoof_templates
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== SMS_SPOOF_LOGS ====================
DROP POLICY IF EXISTS "Authenticated can select sms_spoof_logs" ON public.sms_spoof_logs;
CREATE POLICY "Authenticated can select sms_spoof_logs" ON public.sms_spoof_logs
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- ==================== SMS_LOGS ====================
DROP POLICY IF EXISTS "Admins can select sms_logs" ON public.sms_logs;
CREATE POLICY "Admins can select sms_logs" ON public.sms_logs
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- Drop the old Kunden-specific policy since it's now merged
DROP POLICY IF EXISTS "Kunden can select email_logs" ON public.email_logs;

-- ==================== EMAIL_LOGS ====================
DROP POLICY IF EXISTS "Admins can select email_logs" ON public.email_logs;
CREATE POLICY "Admins can select email_logs" ON public.email_logs
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- ==================== SCHEDULE_BLOCKED_SLOTS ====================
DROP POLICY IF EXISTS "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots;
CREATE POLICY "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== ORDER_APPOINTMENT_BLOCKED_SLOTS ====================
DROP POLICY IF EXISTS "Authenticated can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots;
CREATE POLICY "Authenticated can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== BRANDING_SCHEDULE_SETTINGS ====================
DROP POLICY IF EXISTS "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings;
CREATE POLICY "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== BRANDINGS ====================
DROP POLICY IF EXISTS "Admins can select brandings" ON public.brandings;
CREATE POLICY "Admins can select brandings" ON public.brandings
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can update brandings" ON public.brandings;
CREATE POLICY "Admins can update brandings" ON public.brandings
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can delete brandings" ON public.brandings;
CREATE POLICY "Admins can delete brandings" ON public.brandings
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR id IN (SELECT user_branding_ids(auth.uid())))
  )
);
