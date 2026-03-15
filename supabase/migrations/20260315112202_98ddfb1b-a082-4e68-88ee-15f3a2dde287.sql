
-- 1. Extend orders table with new columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'andere',
  ADD COLUMN IF NOT EXISTS estimated_hours text,
  ADD COLUMN IF NOT EXISTS is_starter_job boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS work_steps jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS required_attachments jsonb DEFAULT '[]'::jsonb;

-- 2. Make order_number optional (allow null, set default)
ALTER TABLE public.orders ALTER COLUMN order_number DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT '';

-- 3. Make provider optional
ALTER TABLE public.orders ALTER COLUMN provider DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN provider SET DEFAULT '';

-- 4. Create order_attachments table
CREATE TABLE public.order_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  attachment_index int NOT NULL,
  file_url text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'eingereicht',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.order_attachments ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read own attachments
CREATE POLICY "Users can select own order_attachments"
ON public.order_attachments FOR SELECT TO authenticated
USING (
  contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid())
);

-- RLS: Users can insert own attachments
CREATE POLICY "Users can insert own order_attachments"
ON public.order_attachments FOR INSERT TO authenticated
WITH CHECK (
  contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid())
);

-- RLS: Admins/Kunden can select all
CREATE POLICY "Admins can select order_attachments"
ON public.order_attachments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (contract_id IN (SELECT contracts_for_branding_ids(auth.uid())))
  ))
);

-- RLS: Admins/Kunden can update (approve/reject)
CREATE POLICY "Admins can update order_attachments"
ON public.order_attachments FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (contract_id IN (SELECT contracts_for_branding_ids(auth.uid())))
  ))
);

-- RLS: Admins can delete
CREATE POLICY "Admins can delete order_attachments"
ON public.order_attachments FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (contract_id IN (SELECT contracts_for_branding_ids(auth.uid())))
  ))
);

-- 5. Create storage bucket for order attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('order-attachments', 'order-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage RLS policies
CREATE POLICY "Users can upload order attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'order-attachments');

CREATE POLICY "Anyone can read order attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'order-attachments');

CREATE POLICY "Admins can delete order attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'order-attachments' AND has_role(auth.uid(), 'admin'::app_role));
