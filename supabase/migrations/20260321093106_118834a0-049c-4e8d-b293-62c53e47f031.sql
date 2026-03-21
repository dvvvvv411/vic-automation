
-- Table: first_workday_appointments
CREATE TABLE public.first_workday_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time without time zone NOT NULL,
  status text NOT NULL DEFAULT 'neu',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  reminder_sent boolean NOT NULL DEFAULT false,
  UNIQUE(application_id)
);

ALTER TABLE public.first_workday_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select first_workday_appointments" ON public.first_workday_appointments FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR
  (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (SELECT apps_for_branding_ids(auth.uid())))) OR
  (is_caller(auth.uid()) AND application_id IN (SELECT apps_for_branding_ids(auth.uid())))
);

CREATE POLICY "Admins can insert first_workday_appointments" ON public.first_workday_appointments FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()) OR is_caller(auth.uid())
);

CREATE POLICY "Admins can update first_workday_appointments" ON public.first_workday_appointments FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin') OR
  (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (SELECT apps_for_branding_ids(auth.uid())))) OR
  (is_caller(auth.uid()) AND application_id IN (SELECT apps_for_branding_ids(auth.uid())))
);

CREATE POLICY "Admins can delete first_workday_appointments" ON public.first_workday_appointments FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin') OR
  (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (SELECT apps_for_branding_ids(auth.uid())))) OR
  (is_caller(auth.uid()) AND application_id IN (SELECT apps_for_branding_ids(auth.uid())))
);

CREATE POLICY "Anyone can view first_workday_appointments" ON public.first_workday_appointments FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can book first_workday_appointments" ON public.first_workday_appointments FOR INSERT TO anon WITH CHECK (true);

-- Table: first_workday_blocked_slots
CREATE TABLE public.first_workday_blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date date NOT NULL,
  blocked_time time without time zone NOT NULL,
  branding_id uuid REFERENCES public.brandings(id),
  reason text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.first_workday_blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read first_workday_blocked_slots" ON public.first_workday_blocked_slots FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated can manage first_workday_blocked_slots" ON public.first_workday_blocked_slots FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))) OR (is_caller(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid()))))
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()) OR is_caller(auth.uid()));

-- RPC: update_first_workday_status
CREATE OR REPLACE FUNCTION public.update_first_workday_status(_appointment_id uuid, _status text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.first_workday_appointments
  SET status = _status
  WHERE id = _appointment_id;
END;
$$;
