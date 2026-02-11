
-- 1. Add status column to applications
ALTER TABLE public.applications ADD COLUMN status text NOT NULL DEFAULT 'neu';

-- 2. Create interview_appointments table
CREATE TABLE public.interview_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_application UNIQUE (application_id),
  CONSTRAINT unique_timeslot UNIQUE (appointment_date, appointment_time)
);

-- 3. Enable RLS
ALTER TABLE public.interview_appointments ENABLE ROW LEVEL SECURITY;

-- 4. Admin full access
CREATE POLICY "Admins can select appointments"
ON public.interview_appointments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert appointments"
ON public.interview_appointments FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update appointments"
ON public.interview_appointments FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete appointments"
ON public.interview_appointments FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Public/anon access for booking
CREATE POLICY "Anyone can view appointments"
ON public.interview_appointments FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anyone can book appointments"
ON public.interview_appointments FOR INSERT
TO anon
WITH CHECK (true);

-- 6. Public read access on applications for the booking page
CREATE POLICY "Anon can select applications"
ON public.applications FOR SELECT
TO anon
USING (true);

-- 7. Anon can update application status
CREATE POLICY "Anon can update application status"
ON public.applications FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 8. Public read access on brandings for the booking page
CREATE POLICY "Anon can select brandings"
ON public.brandings FOR SELECT
TO anon
USING (true);
