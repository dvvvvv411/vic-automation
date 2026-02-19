
-- Schedule Settings table
CREATE TABLE public.schedule_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '18:00',
  slot_interval_minutes integer NOT NULL DEFAULT 30,
  available_days integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedule_settings"
  ON public.schedule_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can read schedule_settings"
  ON public.schedule_settings FOR SELECT
  USING (true);

-- Insert default row
INSERT INTO public.schedule_settings (start_time, end_time, slot_interval_minutes, available_days)
VALUES ('08:00', '18:00', 30, '{1,2,3,4,5,6}');

-- Schedule Blocked Slots table
CREATE TABLE public.schedule_blocked_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocked_date date NOT NULL,
  blocked_time time NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedule_blocked_slots"
  ON public.schedule_blocked_slots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can read schedule_blocked_slots"
  ON public.schedule_blocked_slots FOR SELECT
  USING (true);
