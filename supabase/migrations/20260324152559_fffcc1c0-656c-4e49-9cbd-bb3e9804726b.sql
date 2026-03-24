ALTER TABLE public.interview_appointments
  ADD COLUMN IF NOT EXISTS reminder_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS notification_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb;