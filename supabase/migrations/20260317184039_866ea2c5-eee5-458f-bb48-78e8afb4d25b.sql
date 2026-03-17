ALTER TABLE public.brandings
  ADD COLUMN hourly_rate_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN hourly_rate_minijob numeric,
  ADD COLUMN hourly_rate_teilzeit numeric,
  ADD COLUMN hourly_rate_vollzeit numeric;