-- Add contract_id column to first_workday_appointments
ALTER TABLE public.first_workday_appointments
  ADD COLUMN contract_id uuid REFERENCES public.employment_contracts(id) ON DELETE CASCADE;

-- Backfill existing data
UPDATE public.first_workday_appointments fwa
SET contract_id = ec.id
FROM public.employment_contracts ec
WHERE ec.application_id = fwa.application_id;

-- Make application_id nullable (for new contract-based bookings)
ALTER TABLE public.first_workday_appointments
  ALTER COLUMN application_id DROP NOT NULL;

-- Add RLS policy for authenticated users to book via contract_id
CREATE POLICY "Authenticated can insert first_workday by contract_id"
ON public.first_workday_appointments
FOR INSERT TO authenticated
WITH CHECK (
  contract_id IN (
    SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
  )
);

-- Add RLS policy for users to read own appointments via contract_id
CREATE POLICY "Users can read own first_workday by contract_id"
ON public.first_workday_appointments
FOR SELECT TO authenticated
USING (
  contract_id IN (
    SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
  )
);

-- Anon can also insert by contract_id (for public booking page)
CREATE POLICY "Anon can book first_workday by contract_id"
ON public.first_workday_appointments
FOR INSERT TO anon
WITH CHECK (contract_id IS NOT NULL);

-- Anon can read by contract_id
CREATE POLICY "Anon can read first_workday by contract_id"
ON public.first_workday_appointments
FOR SELECT TO anon
USING (contract_id IS NOT NULL);