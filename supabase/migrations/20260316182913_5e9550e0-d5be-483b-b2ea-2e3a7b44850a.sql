
-- Add schedule_type column to branding_schedule_settings
ALTER TABLE public.branding_schedule_settings 
  ADD COLUMN schedule_type text NOT NULL DEFAULT 'interview';

-- Drop the existing unique constraint on branding_id
ALTER TABLE public.branding_schedule_settings 
  DROP CONSTRAINT IF EXISTS branding_schedule_settings_branding_id_key;

-- Add new unique constraint on (branding_id, schedule_type)
ALTER TABLE public.branding_schedule_settings 
  ADD CONSTRAINT branding_schedule_settings_branding_type_key 
  UNIQUE (branding_id, schedule_type);
