
-- Add spoof_credits column to brandings
ALTER TABLE public.brandings ADD COLUMN IF NOT EXISTS spoof_credits integer DEFAULT NULL;

-- RLS policies for sms_logs: allow Kunden to SELECT their branding's logs
CREATE POLICY "Kunden can select own branding sms_logs"
ON public.sms_logs
FOR SELECT
TO authenticated
USING (
  is_kunde(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid()))
);

-- RLS policies for sms_spoof_logs: allow Kunden to SELECT their branding's logs
CREATE POLICY "Kunden can select own branding sms_spoof_logs"
ON public.sms_spoof_logs
FOR SELECT
TO authenticated
USING (
  is_kunde(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid()))
);
