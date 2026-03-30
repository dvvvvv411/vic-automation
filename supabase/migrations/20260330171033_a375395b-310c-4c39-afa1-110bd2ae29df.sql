
-- Drop old function (return type changed from void to uuid)
DROP FUNCTION IF EXISTS public.book_first_workday_public(uuid, date, time, text);

-- Recreate with uuid return type
CREATE OR REPLACE FUNCTION public.book_first_workday_public(
  _contract_id uuid,
  _appointment_date date,
  _appointment_time time,
  _phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM employment_contracts WHERE id = _contract_id) THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  DELETE FROM first_workday_appointments WHERE contract_id = _contract_id;

  INSERT INTO first_workday_appointments (contract_id, application_id, appointment_date, appointment_time, created_by)
  SELECT _contract_id, ec.application_id, _appointment_date, _appointment_time, ec.created_by
  FROM employment_contracts ec
  WHERE ec.id = _contract_id
  RETURNING id INTO new_id;

  IF _phone IS NOT NULL AND _phone <> '' THEN
    UPDATE employment_contracts SET phone = _phone WHERE id = _contract_id;
  END IF;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_first_workday_public(uuid, date, time, text) TO anon, authenticated;
