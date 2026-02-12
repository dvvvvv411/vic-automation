-- Trigger auf interview_appointments registrieren
CREATE TRIGGER on_interview_success
  AFTER UPDATE ON public.interview_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_contract_on_interview_success();

-- Bereits als erfolgreich markierte Termine nachtraeglich versorgen
INSERT INTO public.employment_contracts (application_id)
SELECT ia.application_id
FROM public.interview_appointments ia
WHERE ia.status = 'erfolgreich'
  AND NOT EXISTS (
    SELECT 1 FROM public.employment_contracts ec
    WHERE ec.application_id = ia.application_id
  );