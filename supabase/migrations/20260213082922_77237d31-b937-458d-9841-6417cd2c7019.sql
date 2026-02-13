
-- Users can select their own order_assignments
CREATE POLICY "Users can select own assignments"
ON public.order_assignments
FOR SELECT
TO authenticated
USING (
  contract_id IN (
    SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
  )
);

-- Users can select orders assigned to them
CREATE POLICY "Users can select assigned orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT order_id FROM public.order_assignments
    WHERE contract_id IN (
      SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
    )
  )
);
