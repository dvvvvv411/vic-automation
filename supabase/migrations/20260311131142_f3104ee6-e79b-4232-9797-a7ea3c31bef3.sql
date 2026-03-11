
-- 1. Security definer function to get branding IDs for a user
CREATE OR REPLACE FUNCTION public.user_branding_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branding_id FROM public.kunde_brandings WHERE user_id = _user_id
$$;

-- 2. Insert mapping: caller@vicpage.com → GUVI GmbH & Co. KG
INSERT INTO public.kunde_brandings (user_id, branding_id)
VALUES ('7f509e3d-d5ab-459e-819c-c7ed6d392eef', 'cbb67ac3-f444-4f68-b5af-aee65d24068c')
ON CONFLICT DO NOTHING;

-- 3. Update applications SELECT policy for admins
DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
CREATE POLICY "Admins can select applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND branding_id IN (SELECT public.user_branding_ids(auth.uid())))
);

-- 4. Update interview_appointments SELECT policy for admins
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
CREATE POLICY "Admins can select appointments"
ON public.interview_appointments
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND application_id IN (
    SELECT id FROM public.applications WHERE branding_id IN (SELECT public.user_branding_ids(auth.uid()))
  ))
);
