-- Public RPC to book/rebook a first workday appointment (no auth required)
CREATE OR REPLACE FUNCTION public.book_first_workday_public(
  _contract_id uuid,
  _appointment_date date,
  _appointment_time time,
  _phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify contract exists
  IF NOT EXISTS (SELECT 1 FROM employment_contracts WHERE id = _contract_id) THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  -- Delete existing appointment for this contract
  DELETE FROM first_workday_appointments WHERE contract_id = _contract_id;

  -- Insert new appointment
  INSERT INTO first_workday_appointments (contract_id, application_id, appointment_date, appointment_time, created_by)
  SELECT _contract_id, ec.application_id, _appointment_date, _appointment_time, ec.created_by
  FROM employment_contracts ec
  WHERE ec.id = _contract_id;

  -- Optionally update phone
  IF _phone IS NOT NULL AND _phone <> '' THEN
    UPDATE employment_contracts SET phone = _phone WHERE id = _contract_id;
  END IF;
END;
$$;

-- Public RPC to update phone on a contract (no auth required, link = access)
CREATE OR REPLACE FUNCTION public.update_contract_phone_public(
  _contract_id uuid,
  _phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE employment_contracts SET phone = _phone WHERE id = _contract_id;
END;
$$;

-- Grant execute to both anon and authenticated
GRANT EXECUTE ON FUNCTION public.book_first_workday_public(uuid, date, time, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_contract_phone_public(uuid, text) TO anon, authenticated;