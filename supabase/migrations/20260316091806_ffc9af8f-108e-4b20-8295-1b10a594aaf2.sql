
-- Add is_videochat column to orders
ALTER TABLE public.orders ADD COLUMN is_videochat boolean NOT NULL DEFAULT false;

-- Create ident_sessions table
CREATE TABLE public.ident_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.order_assignments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting',
  phone_api_url text,
  test_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  branding_id uuid REFERENCES public.brandings(id)
);

-- Enable RLS
ALTER TABLE public.ident_sessions ENABLE ROW LEVEL SECURITY;

-- Admins/Kunden full access
CREATE POLICY "Admins can manage ident_sessions" ON public.ident_sessions
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_kunde(auth.uid())
  );

-- Users can read own sessions
CREATE POLICY "Users can read own ident_sessions" ON public.ident_sessions
  FOR SELECT TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
    )
  );

-- Users can insert own sessions
CREATE POLICY "Users can insert own ident_sessions" ON public.ident_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    contract_id IN (
      SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
    )
  );

-- Users can update own sessions (for marking completed)
CREATE POLICY "Users can update own ident_sessions" ON public.ident_sessions
  FOR UPDATE TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ident_sessions;
