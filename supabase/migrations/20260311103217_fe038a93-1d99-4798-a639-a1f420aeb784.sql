
-- Fix SELECT: Kunde sieht Nachrichten seiner Verträge
DROP POLICY "Kunden can select own chat_messages" ON public.chat_messages;
CREATE POLICY "Kunden can select own chat_messages" ON public.chat_messages
FOR SELECT TO authenticated
USING (
  is_kunde(auth.uid()) AND
  contract_id IN (
    SELECT id FROM employment_contracts WHERE created_by = auth.uid()
  )
);

-- Fix UPDATE: Kunde kann Nachrichten seiner Verträge updaten
DROP POLICY "Admins can update chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can update chat_messages" ON public.chat_messages
FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(), 'admin') AND (created_by = auth.uid() OR created_by IS NULL))
  OR (is_kunde(auth.uid()) AND contract_id IN (
    SELECT id FROM employment_contracts WHERE created_by = auth.uid()
  ))
);
