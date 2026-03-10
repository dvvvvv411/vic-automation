
-- Fix 1: Remove overly permissive anon policies on employment_contracts
DROP POLICY IF EXISTS "Anon can select employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Anon can update employment_contracts" ON public.employment_contracts;

-- Re-create with anon role only (not public) for the submit/sign flows
CREATE POLICY "Anon can select own contract by application"
ON public.employment_contracts
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can update own contract by application"
ON public.employment_contracts
FOR UPDATE
TO anon
USING (true);
