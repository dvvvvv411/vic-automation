CREATE POLICY "Users can insert own assignments from chat offers"
  ON public.order_assignments
  FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM employment_contracts
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM chat_messages
      WHERE chat_messages.contract_id = order_assignments.contract_id
        AND chat_messages.sender_role = 'system'
        AND (chat_messages.metadata->>'type') = 'order_offer'
        AND (chat_messages.metadata->>'order_id')::uuid = order_assignments.order_id
    )
  );