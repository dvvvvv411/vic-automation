
-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'user')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_chat_messages_contract_created ON public.chat_messages (contract_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Admins: full SELECT
CREATE POLICY "Admins can select chat_messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins: INSERT
CREATE POLICY "Admins can insert chat_messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users: SELECT own messages
CREATE POLICY "Users can select own chat_messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (contract_id IN (SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()));

-- Users: INSERT own messages
CREATE POLICY "Users can insert own chat_messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  contract_id IN (SELECT id FROM public.employment_contracts WHERE user_id = auth.uid())
  AND sender_role = 'user'
);

-- Admins: UPDATE read status
CREATE POLICY "Admins can update chat_messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users: UPDATE read on admin messages
CREATE POLICY "Users can mark admin messages as read"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
  contract_id IN (SELECT id FROM public.employment_contracts WHERE user_id = auth.uid())
  AND sender_role = 'admin'
);

-- Chat templates table (admin only)
CREATE TABLE public.chat_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcode text NOT NULL UNIQUE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select chat_templates"
ON public.chat_templates FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chat_templates"
ON public.chat_templates FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chat_templates"
ON public.chat_templates FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chat_templates"
ON public.chat_templates FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
