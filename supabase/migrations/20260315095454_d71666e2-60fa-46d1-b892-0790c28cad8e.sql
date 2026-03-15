
-- Trial day appointments table
CREATE TABLE public.trial_day_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'neu',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id)
);

ALTER TABLE public.trial_day_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select trial_day_appointments" ON public.trial_day_appointments FOR SELECT TO authenticated USING (
  (has_role(auth.uid(), 'admin') AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR (has_role(auth.uid(), 'admin') AND (application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))))
);
CREATE POLICY "Admins can insert trial_day_appointments" ON public.trial_day_appointments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update trial_day_appointments" ON public.trial_day_appointments FOR UPDATE TO authenticated USING (
  (has_role(auth.uid(), 'admin') AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR (is_kunde(auth.uid()) AND (created_by = auth.uid()))
);
CREATE POLICY "Admins can delete trial_day_appointments" ON public.trial_day_appointments FOR DELETE TO authenticated USING (
  (has_role(auth.uid(), 'admin') AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR (is_kunde(auth.uid()) AND (created_by = auth.uid()))
);
CREATE POLICY "Anyone can book trial_day" ON public.trial_day_appointments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can view trial_day" ON public.trial_day_appointments FOR SELECT TO anon USING (true);
CREATE POLICY "Kunden can select own trial_day_appointments" ON public.trial_day_appointments FOR SELECT TO authenticated USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- Trial day blocked slots table
CREATE TABLE public.trial_day_blocked_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocked_date date NOT NULL,
  blocked_time time NOT NULL,
  reason text,
  branding_id uuid REFERENCES public.brandings(id),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trial_day_blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage trial_day_blocked_slots" ON public.trial_day_blocked_slots FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') AND ((created_by = auth.uid()) OR (created_by IS NULL))) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can read trial_day_blocked_slots" ON public.trial_day_blocked_slots FOR SELECT TO public USING (true);
CREATE POLICY "Kunden can manage own trial_day_blocked_slots" ON public.trial_day_blocked_slots FOR ALL TO authenticated USING (is_kunde(auth.uid()) AND created_by = auth.uid()) WITH CHECK (is_kunde(auth.uid()));

-- Update trial day status function
CREATE OR REPLACE FUNCTION public.update_trial_day_status(_appointment_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.trial_day_appointments
  SET status = _status
  WHERE id = _appointment_id;
END;
$$;
