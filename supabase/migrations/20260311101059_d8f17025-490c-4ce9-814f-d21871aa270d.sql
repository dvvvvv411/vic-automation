CREATE POLICY "Users can view contract owner profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  id IN (
    SELECT ec.created_by FROM employment_contracts ec
    WHERE ec.user_id = auth.uid() AND ec.created_by IS NOT NULL
  )
);