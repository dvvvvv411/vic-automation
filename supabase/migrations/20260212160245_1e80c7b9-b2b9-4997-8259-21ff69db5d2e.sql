ALTER TABLE public.interview_appointments
ADD COLUMN status text NOT NULL DEFAULT 'neu';

CREATE OR REPLACE FUNCTION public.update_interview_status(
  _appointment_id uuid, _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.interview_appointments
  SET status = _status
  WHERE id = _appointment_id;
END;
$$;