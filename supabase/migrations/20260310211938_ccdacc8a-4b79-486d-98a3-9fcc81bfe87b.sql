
-- Add branding_ids to telegram_chats
ALTER TABLE public.telegram_chats 
ADD COLUMN branding_ids uuid[] NOT NULL DEFAULT '{}';

-- Create branding_schedule_settings table
CREATE TABLE public.branding_schedule_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '18:00',
  slot_interval_minutes integer NOT NULL DEFAULT 20,
  available_days integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branding_id)
);
ALTER TABLE public.branding_schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage branding_schedule_settings" ON public.branding_schedule_settings
FOR ALL TO public USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon can read branding_schedule_settings" ON public.branding_schedule_settings
FOR SELECT TO public USING (true);

-- Add branding_id to blocked slots tables
ALTER TABLE public.schedule_blocked_slots ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.order_appointment_blocked_slots ADD COLUMN branding_id uuid REFERENCES public.brandings(id);

-- Set default interval to 20 minutes and clear the stichtag
UPDATE public.schedule_settings SET slot_interval_minutes = 20, new_slot_interval_minutes = NULL, interval_change_date = NULL;
