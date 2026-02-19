
CREATE TABLE public.telegram_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL,
  label text NOT NULL DEFAULT '',
  events text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select telegram_chats"
  ON public.telegram_chats FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert telegram_chats"
  ON public.telegram_chats FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update telegram_chats"
  ON public.telegram_chats FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete telegram_chats"
  ON public.telegram_chats FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
