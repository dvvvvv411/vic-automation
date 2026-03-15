ALTER TABLE public.brandings
  ADD COLUMN payment_model text NOT NULL DEFAULT 'per_order',
  ADD COLUMN salary_minijob numeric,
  ADD COLUMN salary_teilzeit numeric,
  ADD COLUMN salary_vollzeit numeric;