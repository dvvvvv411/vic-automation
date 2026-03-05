
CREATE TABLE public.sms_spoof_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_spoof_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sms_spoof_templates"
  ON public.sms_spoof_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
