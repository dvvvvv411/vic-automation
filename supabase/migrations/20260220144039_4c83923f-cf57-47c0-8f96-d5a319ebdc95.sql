ALTER TABLE public.schedule_settings
  ADD COLUMN new_slot_interval_minutes integer,
  ADD COLUMN interval_change_date date;