
CREATE TABLE public.order_appointment_blocked_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocked_date date NOT NULL,
  blocked_time time NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_appointment_blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order_appointment_blocked_slots"
  ON public.order_appointment_blocked_slots
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read order_appointment_blocked_slots"
  ON public.order_appointment_blocked_slots
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
