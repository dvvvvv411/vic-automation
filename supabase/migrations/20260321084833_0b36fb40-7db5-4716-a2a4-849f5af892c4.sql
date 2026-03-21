ALTER TABLE public.branding_schedule_settings
ADD COLUMN weekend_start_time time without time zone DEFAULT NULL,
ADD COLUMN weekend_end_time time without time zone DEFAULT NULL;