
-- Allow authenticated users to insert their own employment contract
CREATE POLICY "Users can insert own employment_contract"
ON public.employment_contracts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
