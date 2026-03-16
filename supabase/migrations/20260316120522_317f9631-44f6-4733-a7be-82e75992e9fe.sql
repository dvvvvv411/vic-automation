
-- Create contract_templates table
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  title text NOT NULL,
  employment_type text NOT NULL,
  salary numeric,
  content text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Admins/Kunden full access
CREATE POLICY "Admins can manage contract_templates" ON public.contract_templates
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid()) OR
      branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid())
  );

-- Users can read templates for their branding
CREATE POLICY "Users can read own branding templates" ON public.contract_templates
  FOR SELECT TO authenticated
  USING (
    user_can_read_branding(branding_id, auth.uid())
  );

-- Add signature columns to brandings
ALTER TABLE public.brandings
  ADD COLUMN IF NOT EXISTS signature_image_url text,
  ADD COLUMN IF NOT EXISTS signer_name text,
  ADD COLUMN IF NOT EXISTS signer_title text,
  ADD COLUMN IF NOT EXISTS signature_font text;

-- Add template_id and contract_dismissed to employment_contracts
ALTER TABLE public.employment_contracts
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.contract_templates(id),
  ADD COLUMN IF NOT EXISTS contract_dismissed boolean NOT NULL DEFAULT false;
