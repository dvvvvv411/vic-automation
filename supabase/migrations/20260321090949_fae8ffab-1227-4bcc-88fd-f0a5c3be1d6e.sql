ALTER TABLE public.brandings
  ADD COLUMN email_logo_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN email_logo_url text;