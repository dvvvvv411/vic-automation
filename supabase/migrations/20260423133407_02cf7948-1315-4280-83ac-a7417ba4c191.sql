CREATE OR REPLACE FUNCTION public.interview_booked_slots_for_branding(_branding_id uuid)
RETURNS TABLE(appointment_date date, appointment_time time without time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ia.appointment_date, ia.appointment_time
  FROM interview_appointments ia
  JOIN applications a ON a.id = ia.application_id
  WHERE a.branding_id = _branding_id
$$;

CREATE OR REPLACE FUNCTION public.trial_day_booked_slots_for_branding(_branding_id uuid)
RETURNS TABLE(appointment_date date, appointment_time time without time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tda.appointment_date, tda.appointment_time
  FROM trial_day_appointments tda
  JOIN applications a ON a.id = tda.application_id
  WHERE a.branding_id = _branding_id
$$;

GRANT EXECUTE ON FUNCTION public.interview_booked_slots_for_branding(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_day_booked_slots_for_branding(uuid) TO anon, authenticated;