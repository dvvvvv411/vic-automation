ALTER TABLE public.interview_appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent boolean NOT NULL DEFAULT false;
ALTER TABLE public.trial_day_appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent boolean NOT NULL DEFAULT false;
ALTER TABLE public.first_workday_appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent boolean NOT NULL DEFAULT false;