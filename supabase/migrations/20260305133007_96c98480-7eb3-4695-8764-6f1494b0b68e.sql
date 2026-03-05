
CREATE TABLE public.sms_spoof_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone text NOT NULL,
  recipient_name text,
  sender_name text NOT NULL,
  message text NOT NULL,
  template_id uuid REFERENCES public.sms_spoof_templates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_spoof_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select sms_spoof_logs"
  ON public.sms_spoof_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
