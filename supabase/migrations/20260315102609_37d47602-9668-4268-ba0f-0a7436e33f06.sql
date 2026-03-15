
-- Fix infinite recursion: replace the "Users can read assigned branding" policy
-- with a SECURITY DEFINER function that bypasses RLS

CREATE OR REPLACE FUNCTION public.user_can_read_branding(_branding_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.employment_contracts ec ON ec.application_id = a.id
    WHERE a.branding_id = _branding_id
      AND ec.user_id = _user_id
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can read assigned branding" ON public.brandings;

-- Recreate with the security definer function
CREATE POLICY "Users can read assigned branding"
ON public.brandings
FOR SELECT
TO authenticated
USING (public.user_can_read_branding(id, auth.uid()));
