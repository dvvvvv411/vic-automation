
CREATE POLICY "Users can update own draft order_attachments"
ON public.order_attachments
FOR UPDATE
TO authenticated
USING (
  contract_id IN (SELECT ec.id FROM employment_contracts ec WHERE ec.user_id = auth.uid())
)
WITH CHECK (
  contract_id IN (SELECT ec.id FROM employment_contracts ec WHERE ec.user_id = auth.uid())
);
