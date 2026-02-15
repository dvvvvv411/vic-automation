
-- Add status column to order_assignments
ALTER TABLE public.order_assignments ADD COLUMN status text NOT NULL DEFAULT 'offen';

-- Add balance column to employment_contracts
ALTER TABLE public.employment_contracts ADD COLUMN balance numeric(10,2) NOT NULL DEFAULT 0;

-- Users can update their own order_assignments (to set status to in_pruefung)
CREATE POLICY "Users can update own assignments"
ON public.order_assignments
FOR UPDATE
USING (contract_id IN (
  SELECT id FROM employment_contracts WHERE user_id = auth.uid()
));

-- Admins can update order_assignments (already have select/insert/delete, need update)
CREATE POLICY "Admins can update order_assignments"
ON public.order_assignments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete order_reviews
CREATE POLICY "Admins can delete order_reviews"
ON public.order_reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
