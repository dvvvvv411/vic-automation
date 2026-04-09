ALTER TABLE public.sms_spoof_logs ADD COLUMN source text DEFAULT 'auto';
UPDATE public.sms_spoof_logs SET source = 'manual';