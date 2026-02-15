DROP POLICY "Users can insert own chat_messages" ON chat_messages;

CREATE POLICY "Users can insert own chat_messages" ON chat_messages
  FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM employment_contracts WHERE user_id = auth.uid()
    )
    AND sender_role IN ('user', 'system')
  );