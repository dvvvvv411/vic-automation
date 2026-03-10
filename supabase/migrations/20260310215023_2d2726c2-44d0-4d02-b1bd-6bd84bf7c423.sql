
-- 1. Extend app_role enum with 'kunde'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kunde';
