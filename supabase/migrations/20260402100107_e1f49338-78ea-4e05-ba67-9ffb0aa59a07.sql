ALTER TABLE trial_day_appointments 
ADD COLUMN IF NOT EXISTS success_notification_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_notification_timestamps jsonb DEFAULT '[]'::jsonb;