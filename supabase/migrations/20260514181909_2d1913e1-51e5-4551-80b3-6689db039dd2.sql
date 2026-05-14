-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Brandings
CREATE TABLE public.brandings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  company_name text NOT NULL,
  street text, zip_code text, city text,
  trade_register text, register_court text, managing_director text,
  vat_id text, domain text, email text,
  brand_color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brandings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can select brandings" ON public.brandings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert brandings" ON public.brandings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update brandings" ON public.brandings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete brandings" ON public.brandings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can select brandings" ON public.brandings FOR SELECT TO anon USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('branding-logos', 'branding-logos', true);
CREATE POLICY "Admins can upload branding logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Branding logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'branding-logos');
CREATE POLICY "Admins can update branding logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete branding logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));

-- Applications
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL, last_name text NOT NULL,
  email text NOT NULL, phone text,
  street text, zip_code text, city text,
  employment_type text NOT NULL CHECK (employment_type IN ('minijob', 'teilzeit', 'vollzeit')),
  branding_id uuid REFERENCES public.brandings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'neu',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can select applications" ON public.applications FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert applications" ON public.applications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete applications" ON public.applications FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon can select applications" ON public.applications FOR SELECT TO anon USING (true);

CREATE OR REPLACE FUNCTION public.update_application_status(_application_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.applications SET status = _status WHERE id = _application_id; END; $$;

CREATE OR REPLACE FUNCTION public.update_application_phone(_application_id uuid, _phone text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN UPDATE public.applications SET phone = _phone WHERE id = _application_id; END; $$;

-- Interview appointments
CREATE TABLE public.interview_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'neu',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_application UNIQUE (application_id),
  CONSTRAINT unique_timeslot UNIQUE (appointment_date, appointment_time)
);
ALTER TABLE public.interview_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can select appointments" ON public.interview_appointments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert appointments" ON public.interview_appointments FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update appointments" ON public.interview_appointments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete appointments" ON public.interview_appointments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view appointments" ON public.interview_appointments FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can book appointments" ON public.interview_appointments FOR INSERT TO anon WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_interview_status(_appointment_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN UPDATE public.interview_appointments SET status = _status WHERE id = _appointment_id; END; $$;

-- Employment contracts
CREATE TABLE public.employment_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id),
  first_name text, last_name text, email text, phone text,
  birth_date date, street text, zip_code text, city text,
  marital_status text, employment_type text, desired_start_date date,
  social_security_number text, tax_id text, health_insurance text,
  iban text, bic text, bank_name text,
  id_front_url text, id_back_url text,
  status text NOT NULL DEFAULT 'offen',
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  UNIQUE(application_id)
);
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert employment_contracts" ON public.employment_contracts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon can select employment_contracts" ON public.employment_contracts FOR SELECT USING (true);
CREATE POLICY "Anon can update employment_contracts" ON public.employment_contracts FOR UPDATE USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', true);
CREATE POLICY "Anyone can upload contract documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contract-documents');
CREATE POLICY "Anyone can view contract documents" ON storage.objects FOR SELECT USING (bucket_id = 'contract-documents');

CREATE OR REPLACE FUNCTION public.submit_employment_contract(
  _contract_id uuid, _first_name text, _last_name text, _email text, _phone text,
  _birth_date date, _street text, _zip_code text, _city text, _marital_status text,
  _employment_type text, _desired_start_date date, _social_security_number text,
  _tax_id text, _health_insurance text, _iban text, _bic text, _bank_name text,
  _id_front_url text, _id_back_url text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.employment_contracts SET
    first_name=_first_name, last_name=_last_name, email=_email, phone=_phone,
    birth_date=_birth_date, street=_street, zip_code=_zip_code, city=_city,
    marital_status=_marital_status, employment_type=_employment_type, desired_start_date=_desired_start_date,
    social_security_number=_social_security_number, tax_id=_tax_id, health_insurance=_health_insurance,
    iban=_iban, bic=_bic, bank_name=_bank_name, id_front_url=_id_front_url, id_back_url=_id_back_url,
    status='eingereicht', submitted_at=now()
  WHERE id = _contract_id;
END; $$;

CREATE OR REPLACE FUNCTION public.approve_employment_contract(_contract_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN UPDATE public.employment_contracts SET status='genehmigt' WHERE id=_contract_id; END; $$;

CREATE OR REPLACE FUNCTION public.create_contract_on_interview_success()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'erfolgreich' AND (OLD.status IS NULL OR OLD.status <> 'erfolgreich') THEN
    INSERT INTO public.employment_contracts (application_id) VALUES (NEW.application_id) ON CONFLICT (application_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_interview_success_create_contract AFTER UPDATE ON public.interview_appointments FOR EACH ROW EXECUTE FUNCTION public.create_contract_on_interview_success();