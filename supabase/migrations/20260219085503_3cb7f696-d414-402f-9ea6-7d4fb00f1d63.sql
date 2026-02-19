
-- Add attachment_url column to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN attachment_url text;

-- Create chat-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Storage policies: Admins can upload
CREATE POLICY "Admins can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies: Admins can read
CREATE POLICY "Admins can read chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies: Users can upload to own contract folder
CREATE POLICY "Users can upload own chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM employment_contracts WHERE user_id = auth.uid()
  )
);

-- Storage policies: Users can read own chat attachments
CREATE POLICY "Users can read own chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM employment_contracts WHERE user_id = auth.uid()
  )
);
