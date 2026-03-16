ALTER TABLE public.brandings
  ADD COLUMN IF NOT EXISTS chat_display_name text,
  ADD COLUMN IF NOT EXISTS chat_avatar_url text,
  ADD COLUMN IF NOT EXISTS chat_online boolean NOT NULL DEFAULT false;