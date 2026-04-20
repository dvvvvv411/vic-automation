UPDATE public.applications
SET status = 'neu'
WHERE is_meta = true
  AND created_at::date = CURRENT_DATE
  AND status = 'bewerbungsgespraech'
  AND NOT EXISTS (
    SELECT 1 FROM public.sms_logs s
    WHERE s.event_type = 'bewerbung_angenommen_extern_meta'
      AND s.created_at::date = CURRENT_DATE
      AND s.recipient_name ILIKE applications.first_name || ' ' || applications.last_name
  );

DELETE FROM public.interview_appointments
WHERE application_id IN (
  SELECT id FROM public.applications
  WHERE is_meta = true
    AND created_at::date = CURRENT_DATE
    AND status = 'neu'
)
AND created_at::date = CURRENT_DATE;