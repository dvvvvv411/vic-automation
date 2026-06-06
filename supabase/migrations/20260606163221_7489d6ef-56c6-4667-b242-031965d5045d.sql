ALTER TABLE public.brandings
  ADD COLUMN IF NOT EXISTS custom_email_link_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_email_link text;