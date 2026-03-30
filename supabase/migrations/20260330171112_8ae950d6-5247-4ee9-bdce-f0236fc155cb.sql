
-- Fix Kevin Gehrmann's appointment
UPDATE public.first_workday_appointments
SET contract_id = '25ccd550-627d-480c-967b-734aad8daad2',
    application_id = '5de180fc-87e6-4b14-b2f0-dff56ed6d1f6'
WHERE id = 'acd0c831-6400-4bfa-882d-fbc1bac2a22e';

-- Backfill all orphaned appointments (contract_id IS NULL but application_id exists)
UPDATE public.first_workday_appointments fwa
SET contract_id = ec.id
FROM public.employment_contracts ec
WHERE fwa.contract_id IS NULL
  AND fwa.application_id IS NOT NULL
  AND ec.application_id = fwa.application_id;
