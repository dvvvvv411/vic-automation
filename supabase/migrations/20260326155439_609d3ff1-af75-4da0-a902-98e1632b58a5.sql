CREATE POLICY "Anon can delete own appointment for rebooking"
ON public.interview_appointments
FOR DELETE
TO anon
USING (true);