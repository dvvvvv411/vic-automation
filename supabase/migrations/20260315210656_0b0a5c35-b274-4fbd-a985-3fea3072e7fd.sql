
-- Make application_id nullable for self-registered users
ALTER TABLE public.employment_contracts ALTER COLUMN application_id DROP NOT NULL;

-- Function: auto-assign starter jobs when a contract is created
CREATE OR REPLACE FUNCTION public.assign_starter_jobs()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.order_assignments (contract_id, order_id, status)
  SELECT NEW.id, o.id, 'offen'
  FROM public.orders o
  WHERE o.is_starter_job = true
    AND (o.branding_id = NEW.branding_id OR o.branding_id IS NULL)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contract_assign_starter_jobs
  AFTER INSERT ON public.employment_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_starter_jobs();
