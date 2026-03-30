
-- Trigger function to normalize email to lowercase
CREATE OR REPLACE FUNCTION public.normalize_email_lowercase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on employment_contracts
CREATE TRIGGER trg_normalize_email_employment_contracts
BEFORE INSERT OR UPDATE ON public.employment_contracts
FOR EACH ROW EXECUTE FUNCTION public.normalize_email_lowercase();

-- Trigger on applications
CREATE TRIGGER trg_normalize_email_applications
BEFORE INSERT OR UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.normalize_email_lowercase();

-- Clean up existing data
UPDATE public.employment_contracts SET email = lower(trim(email)) WHERE email IS NOT NULL AND email != lower(trim(email));
UPDATE public.applications SET email = lower(trim(email)) WHERE email IS NOT NULL AND email != lower(trim(email));
