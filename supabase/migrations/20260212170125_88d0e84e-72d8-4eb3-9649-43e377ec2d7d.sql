
ALTER TABLE public.employment_contracts 
  ADD COLUMN user_id uuid,
  ADD COLUMN temp_password text;
