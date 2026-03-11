
-- 1. Add branding_id to sms_logs
ALTER TABLE public.sms_logs ADD COLUMN branding_id uuid REFERENCES public.brandings(id);

-- 2. Add email to profiles
ALTER TABLE public.profiles ADD COLUMN email text;

-- 3. Update handle_new_user trigger to also save email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;

-- 4. Fix RLS on sms_spoof_logs: Admin should see ALL logs, not just own
DROP POLICY IF EXISTS "Admins can select sms_spoof_logs" ON public.sms_spoof_logs;
CREATE POLICY "Admins can select all sms_spoof_logs"
  ON public.sms_spoof_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
