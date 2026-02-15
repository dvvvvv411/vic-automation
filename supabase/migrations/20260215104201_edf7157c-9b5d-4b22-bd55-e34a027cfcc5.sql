
-- Create order_appointments table
CREATE TABLE public.order_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_appointments ENABLE ROW LEVEL SECURITY;

-- Admin SELECT
CREATE POLICY "Admins can select order_appointments"
ON public.order_appointments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can select own appointments
CREATE POLICY "Users can select own order_appointments"
ON public.order_appointments
FOR SELECT
USING (contract_id IN (
  SELECT id FROM employment_contracts WHERE user_id = auth.uid()
));

-- Users can insert own appointments
CREATE POLICY "Users can insert own order_appointments"
ON public.order_appointments
FOR INSERT
WITH CHECK (contract_id IN (
  SELECT id FROM employment_contracts WHERE user_id = auth.uid()
));
