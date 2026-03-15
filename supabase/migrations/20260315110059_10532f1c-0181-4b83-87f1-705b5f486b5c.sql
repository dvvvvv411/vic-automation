
-- 1. Add branding_id column to employment_contracts
ALTER TABLE public.employment_contracts
ADD COLUMN branding_id uuid REFERENCES public.brandings(id);

-- 2. Backfill from applications
UPDATE public.employment_contracts ec
SET branding_id = a.branding_id
FROM public.applications a
WHERE a.id = ec.application_id;

-- 3. Trigger to auto-populate branding_id on insert
CREATE OR REPLACE FUNCTION public.set_contract_branding_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.branding_id IS NULL AND NEW.application_id IS NOT NULL THEN
    SELECT branding_id INTO NEW.branding_id
    FROM public.applications
    WHERE id = NEW.application_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_contract_branding_id
BEFORE INSERT ON public.employment_contracts
FOR EACH ROW
EXECUTE FUNCTION public.set_contract_branding_id();

-- 4. Update contracts_for_branding_ids to use direct column
CREATE OR REPLACE FUNCTION public.contracts_for_branding_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employment_contracts
  WHERE branding_id IN (SELECT public.user_branding_ids(_user_id));
$$;

-- 5. Simplify RLS policies on employment_contracts to use branding_id directly
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (branding_id IN (SELECT user_branding_ids(auth.uid())))
  ))
);

DROP POLICY IF EXISTS "Admins can update employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (branding_id IN (SELECT user_branding_ids(auth.uid())))
  ))
);

DROP POLICY IF EXISTS "Admins can delete employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (branding_id IN (SELECT user_branding_ids(auth.uid())))
  ))
);
