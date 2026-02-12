
CREATE OR REPLACE FUNCTION public.update_application_phone(_application_id uuid, _phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.applications
  SET phone = _phone
  WHERE id = _application_id;
END;
$$;
