
CREATE OR REPLACE FUNCTION public.decrement_spoof_credits(_branding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.brandings
  SET spoof_credits = spoof_credits - 1
  WHERE id = _branding_id
    AND spoof_credits IS NOT NULL;
END;
$$;
