CREATE POLICY "Anon can delete own trial appointment for rebooking"
ON public.trial_day_appointments
FOR DELETE
TO anon
USING (true);