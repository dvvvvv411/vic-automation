ALTER TABLE public.brandings
  ADD COLUMN IF NOT EXISTS project_manager_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS project_manager_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS project_manager_image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recruiter_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recruiter_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recruiter_image_url text DEFAULT NULL;