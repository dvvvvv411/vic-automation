
-- SMS Templates
CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text UNIQUE NOT NULL,
  label text NOT NULL,
  message text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select sms_templates" ON public.sms_templates FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert sms_templates" ON public.sms_templates FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update sms_templates" ON public.sms_templates FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sms_templates" ON public.sms_templates FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default templates
INSERT INTO public.sms_templates (event_type, label, message) VALUES
  ('bewerbung_angenommen', 'Bewerbung angenommen', 'Hallo {name}, Ihre Bewerbung wurde angenommen! Bitte buchen Sie Ihren Termin: {link}'),
  ('vertrag_genehmigt', 'Vertrag genehmigt', 'Hallo {name}, Ihr Arbeitsvertrag wurde genehmigt. Loggen Sie sich ein: {link}'),
  ('auftrag_zugewiesen', 'Neuer Auftrag', 'Hallo {name}, Ihnen wurde ein neuer Auftrag zugewiesen: {auftrag}. Details im Mitarbeiterportal.'),
  ('termin_gebucht', 'Termin gebucht', 'Hallo {name}, Ihr Termin am {datum} um {uhrzeit} Uhr wurde bestaetigt.'),
  ('bewertung_genehmigt', 'Bewertung genehmigt', 'Hallo {name}, Ihre Bewertung fuer "{auftrag}" wurde genehmigt. Praemie: {praemie}.'),
  ('bewertung_abgelehnt', 'Bewertung abgelehnt', 'Hallo {name}, Ihre Bewertung fuer "{auftrag}" wurde leider abgelehnt. Bitte erneut bewerten.');

-- SMS Logs
CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  recipient_phone text NOT NULL,
  recipient_name text,
  message text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select sms_logs" ON public.sms_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
