ALTER TABLE interview_appointments 
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
ALTER TABLE trial_day_appointments 
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;