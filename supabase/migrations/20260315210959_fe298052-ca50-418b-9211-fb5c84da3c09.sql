
-- Update user_can_read_branding to also check direct branding_id on employment_contracts
CREATE OR REPLACE FUNCTION public.user_can_read_branding(_branding_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employment_contracts ec
    LEFT JOIN public.applications a ON ec.application_id = a.id
    WHERE ec.user_id = _user_id
      AND (a.branding_id = _branding_id OR ec.branding_id = _branding_id)
  );
$$;
