
-- Neue Spalten in employment_contracts
ALTER TABLE public.employment_contracts
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS contract_pdf_url text,
  ADD COLUMN IF NOT EXISTS signed_contract_pdf_url text,
  ADD COLUMN IF NOT EXISTS signature_data text;

-- RPC-Funktion erweitern um birth_place und nationality
CREATE OR REPLACE FUNCTION public.submit_employment_contract(
  _contract_id uuid,
  _first_name text,
  _last_name text,
  _email text,
  _phone text,
  _birth_date date,
  _birth_place text,
  _nationality text,
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
    birth_place = _birth_place,
    nationality = _nationality,
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
