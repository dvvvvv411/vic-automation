
CREATE TABLE public.order_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  question text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

-- Admins can view all reviews
CREATE POLICY "Admins can select order_reviews"
ON public.order_reviews FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert reviews for their assigned orders
CREATE POLICY "Users can insert own order_reviews"
ON public.order_reviews FOR INSERT
WITH CHECK (
  contract_id IN (
    SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()
  )
  AND order_id IN (
    SELECT oa.order_id FROM public.order_assignments oa
    WHERE oa.contract_id IN (
      SELECT ec2.id FROM public.employment_contracts ec2 WHERE ec2.user_id = auth.uid()
    )
  )
);

-- Users can read their own reviews
CREATE POLICY "Users can select own order_reviews"
ON public.order_reviews FOR SELECT
USING (
  contract_id IN (
    SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX idx_order_reviews_order_contract ON public.order_reviews(order_id, contract_id);
