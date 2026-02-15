
CREATE POLICY "Users can read own application"
ON public.applications
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT application_id FROM employment_contracts
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read assigned branding"
ON public.brandings
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT a.branding_id FROM applications a
    JOIN employment_contracts ec ON ec.application_id = a.id
    WHERE ec.user_id = auth.uid()
  )
);
