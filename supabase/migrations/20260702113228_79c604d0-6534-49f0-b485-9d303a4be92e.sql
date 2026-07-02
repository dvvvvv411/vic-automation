
CREATE OR REPLACE FUNCTION public.book_first_workday_public(
  _contract_id uuid,
  _appointment_date date,
  _appointment_time time without time zone,
  _phone text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  v_branding_id uuid;
  v_settings record;
  v_available_days int[];
  v_start time;
  v_end time;
  v_iso_dow int;
  v_is_weekend boolean;
BEGIN
  SELECT ec.branding_id INTO v_branding_id
  FROM employment_contracts ec
  WHERE ec.id = _contract_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  -- Load schedule settings (shared with trial day). Fallback defaults if none configured.
  SELECT available_days, start_time, end_time, weekend_start_time, weekend_end_time
  INTO v_settings
  FROM branding_schedule_settings
  WHERE branding_id = v_branding_id AND schedule_type = 'trial'
  LIMIT 1;

  IF v_settings IS NULL THEN
    v_available_days := ARRAY[1,2,3,4,5,6];
    v_start := '08:00'::time;
    v_end := '18:00'::time;
  ELSE
    v_available_days := COALESCE(v_settings.available_days, ARRAY[1,2,3,4,5,6]);
    v_iso_dow := EXTRACT(ISODOW FROM _appointment_date)::int;
    v_is_weekend := v_iso_dow IN (6,7);
    IF v_is_weekend AND v_settings.weekend_start_time IS NOT NULL THEN
      v_start := v_settings.weekend_start_time;
      v_end := COALESCE(v_settings.weekend_end_time, v_settings.end_time, '18:00'::time);
    ELSE
      v_start := COALESCE(v_settings.start_time, '08:00'::time);
      v_end := COALESCE(v_settings.end_time, '18:00'::time);
    END IF;
  END IF;

  v_iso_dow := EXTRACT(ISODOW FROM _appointment_date)::int;

  -- 1) Weekday must be available
  IF NOT (v_iso_dow = ANY(v_available_days)) THEN
    RAISE EXCEPTION 'Dieser Wochentag ist nicht verfügbar';
  END IF;

  -- 2) Time must be within window
  IF _appointment_time < v_start OR _appointment_time >= v_end THEN
    RAISE EXCEPTION 'Diese Uhrzeit liegt außerhalb der verfügbaren Zeit';
  END IF;

  -- 3) Slot must not be blocked
  IF EXISTS (
    SELECT 1 FROM first_workday_blocked_slots
    WHERE branding_id = v_branding_id
      AND blocked_date = _appointment_date
      AND blocked_time = _appointment_time
  ) OR EXISTS (
    SELECT 1 FROM trial_day_blocked_slots
    WHERE branding_id = v_branding_id
      AND blocked_date = _appointment_date
      AND blocked_time = _appointment_time
  ) THEN
    RAISE EXCEPTION 'Dieser Termin ist blockiert';
  END IF;

  -- 4) No double booking (across first_workday & trial appointments for this branding)
  IF EXISTS (
    SELECT 1 FROM booked_slots_for_branding(v_branding_id) bs
    WHERE bs.appointment_date = _appointment_date
      AND bs.appointment_time = _appointment_time
  ) THEN
    -- allow existing booking by same contract to be replaced silently
    IF NOT EXISTS (
      SELECT 1 FROM first_workday_appointments
      WHERE contract_id = _contract_id
        AND appointment_date = _appointment_date
        AND appointment_time = _appointment_time
    ) THEN
      RAISE EXCEPTION 'Dieser Termin ist bereits vergeben';
    END IF;
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
$function$;
