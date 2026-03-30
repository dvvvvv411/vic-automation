
-- 1. Security definer function for booked slots
CREATE OR REPLACE FUNCTION public.booked_slots_for_branding(_branding_id uuid)
RETURNS TABLE(appointment_date date, appointment_time time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT fwa.appointment_date, fwa.appointment_time
  FROM first_workday_appointments fwa
  WHERE fwa.contract_id IN (
    SELECT id FROM employment_contracts WHERE branding_id = _branding_id
  )
  UNION
  SELECT fwa.appointment_date, fwa.appointment_time
  FROM first_workday_appointments fwa
  WHERE fwa.application_id IN (
    SELECT id FROM applications WHERE branding_id = _branding_id
  )
  UNION
  SELECT tda.appointment_date, tda.appointment_time
  FROM trial_day_appointments tda
  WHERE tda.application_id IN (
    SELECT id FROM applications WHERE branding_id = _branding_id
  )
$$;

-- 2. User can delete own first_workday_appointments for rebooking
CREATE POLICY "Users can delete own first_workday_appointments"
ON public.first_workday_appointments FOR DELETE TO authenticated
USING (
  contract_id IN (
    SELECT id FROM employment_contracts WHERE user_id = auth.uid()
  )
);

-- 3. All authenticated users can read sms_templates
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read sms_templates"
ON public.sms_templates FOR SELECT TO authenticated
USING (true);
