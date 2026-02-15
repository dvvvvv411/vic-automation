ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_sender_role_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_role_check
  CHECK (sender_role = ANY (ARRAY['admin', 'user', 'system']));