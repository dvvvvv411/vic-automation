
-- Employment contracts table
CREATE TABLE public.employment_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id),
  first_name text,
  last_name text,
  email text,
  phone text,
  birth_date date,
  street text,
  zip_code text,
  city text,
  marital_status text,
  employment_type text,
  desired_start_date date,
  social_security_number text,
  tax_id text,
  health_insurance text,
  iban text,
  bic text,
  bank_name text,
  id_front_url text,
  id_back_url text,
  status text NOT NULL DEFAULT 'offen',
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  UNIQUE(application_id)
);

ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can select employment_contracts"
ON public.employment_contracts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert employment_contracts"
ON public.employment_contracts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update employment_contracts"
ON public.employment_contracts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete employment_contracts"
ON public.employment_contracts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anon policies for applicant form
CREATE POLICY "Anon can select employment_contracts"
ON public.employment_contracts FOR SELECT
USING (true);

CREATE POLICY "Anon can update employment_contracts"
ON public.employment_contracts FOR UPDATE
USING (true);

-- Storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', true);

CREATE POLICY "Anyone can upload contract documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contract-documents');

CREATE POLICY "Anyone can view contract documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-documents');

-- Submit function
CREATE OR REPLACE FUNCTION public.submit_employment_contract(
  _contract_id uuid,
  _first_name text,
  _last_name text,
  _email text,
  _phone text,
  _birth_date date,
  _street text,
  _zip_code text,
  _city text,
  _marital_status text,
  _employment_type text,
  _desired_start_date date,
  _social_security_number text,
  _tax_id text,
  _health_insurance text,
  _iban text,
  _bic text,
  _bank_name text,
  _id_front_url text,
  _id_back_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.employment_contracts
  SET
    first_name = _first_name,
    last_name = _last_name,
    email = _email,
    phone = _phone,
    birth_date = _birth_date,
    street = _street,
    zip_code = _zip_code,
    city = _city,
    marital_status = _marital_status,
    employment_type = _employment_type,
    desired_start_date = _desired_start_date,
    social_security_number = _social_security_number,
    tax_id = _tax_id,
    health_insurance = _health_insurance,
    iban = _iban,
    bic = _bic,
    bank_name = _bank_name,
    id_front_url = _id_front_url,
    id_back_url = _id_back_url,
    status = 'eingereicht',
    submitted_at = now()
  WHERE id = _contract_id;
END;
$$;

-- Approve function
CREATE OR REPLACE FUNCTION public.approve_employment_contract(_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.employment_contracts
  SET status = 'genehmigt'
  WHERE id = _contract_id;
END;
$$;

-- Trigger: auto-create contract when interview marked as erfolgreich
CREATE OR REPLACE FUNCTION public.create_contract_on_interview_success()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'erfolgreich' AND (OLD.status IS NULL OR OLD.status <> 'erfolgreich') THEN
    INSERT INTO public.employment_contracts (application_id)
    VALUES (NEW.application_id)
    ON CONFLICT (application_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_interview_success_create_contract
AFTER UPDATE ON public.interview_appointments
FOR EACH ROW
EXECUTE FUNCTION public.create_contract_on_interview_success();
