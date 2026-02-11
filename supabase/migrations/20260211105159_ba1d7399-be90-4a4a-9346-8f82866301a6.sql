
-- Replace overly permissive anon UPDATE policy with a restricted function
DROP POLICY "Anon can update application status" ON public.applications;

-- Create a security definer function that only updates status
CREATE OR REPLACE FUNCTION public.update_application_status(
  _application_id uuid,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.applications
  SET status = _status
  WHERE id = _application_id;
END;
$$;
