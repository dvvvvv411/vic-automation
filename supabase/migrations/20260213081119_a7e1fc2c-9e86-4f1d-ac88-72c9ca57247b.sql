
CREATE TABLE public.order_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, contract_id)
);

ALTER TABLE public.order_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select order_assignments"
  ON public.order_assignments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert order_assignments"
  ON public.order_assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete order_assignments"
  ON public.order_assignments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
