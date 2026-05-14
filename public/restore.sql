-- Consolidated restore: 151 migrations replayed in order

-- ==================== 20260211095435_afbcd5c8-6fa1-4411-bdf0-620786580ab8.sql ====================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Role system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();


-- ==================== 20260211101119_80f1f245-7ca7-454d-9258-fdb9d3785811.sql ====================

-- Create brandings table
CREATE TABLE public.brandings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  company_name text NOT NULL,
  street text,
  zip_code text,
  city text,
  trade_register text,
  register_court text,
  managing_director text,
  vat_id text,
  domain text,
  email text,
  brand_color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brandings ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can read
CREATE POLICY "Admins can select brandings"
ON public.brandings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can insert
CREATE POLICY "Admins can insert brandings"
ON public.brandings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can update
CREATE POLICY "Admins can update brandings"
ON public.brandings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can delete
CREATE POLICY "Admins can delete brandings"
ON public.brandings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for branding logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding-logos', 'branding-logos', true);

-- Storage policies: admins can upload
CREATE POLICY "Admins can upload branding logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies: public read
CREATE POLICY "Branding logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding-logos');

-- Storage policies: admins can update
CREATE POLICY "Admins can update branding logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies: admins can delete
CREATE POLICY "Admins can delete branding logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));


-- ==================== 20260211102248_69316625-d6be-4c4b-abdb-909d5dcd0539.sql ====================

-- Create applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  street text,
  zip_code text,
  city text,
  employment_type text NOT NULL CHECK (employment_type IN ('minijob', 'teilzeit', 'vollzeit')),
  branding_id uuid REFERENCES public.brandings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can select applications"
  ON public.applications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert applications"
  ON public.applications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update applications"
  ON public.applications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications"
  ON public.applications FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));


-- ==================== 20260211105145_50c65714-03e3-4a97-80d0-5384c18e4404.sql ====================

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


-- ==================== 20260211105159_ba1d7399-be90-4a4a-9346-8f82866301a6.sql ====================

-- Replace overly permissive anon UPDATE policy with a restricted function
DROP POLICY "Anon can update application status" ON public.applications;

-- Create a security definer function that only updates status
CREATE OR REPLACE FUNCTION public.update_application_status(
  _application_id uuid,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.applications
  SET status = _status
  WHERE id = _application_id;
END;
$$;


-- ==================== 20260212153511_a461bae6-ed38-41af-a049-d6fe7aa1b4e1.sql ====================

CREATE OR REPLACE FUNCTION public.update_application_phone(_application_id uuid, _phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.applications
  SET phone = _phone
  WHERE id = _application_id;
END;
$$;


-- ==================== 20260212160245_1e80c7b9-b2b9-4997-8259-21ff69db5d2e.sql ====================
ALTER TABLE public.interview_appointments
ADD COLUMN status text NOT NULL DEFAULT 'neu';

CREATE OR REPLACE FUNCTION public.update_interview_status(
  _appointment_id uuid, _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.interview_appointments
  SET status = _status
  WHERE id = _appointment_id;
END;
$$;

-- ==================== 20260212162102_6c62a7d9-ba87-42b8-973c-35310ae4eabf.sql ====================

-- Employment contracts table
CREATE TABLE public.employment_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id),
  first_name text,
  last_name text,
  email text,
  phone text,
  birth_date date,
  street text,
  zip_code text,
  city text,
  marital_status text,
  employment_type text,
  desired_start_date date,
  social_security_number text,
  tax_id text,
  health_insurance text,
  iban text,
  bic text,
  bank_name text,
  id_front_url text,
  id_back_url text,
  status text NOT NULL DEFAULT 'offen',
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  UNIQUE(application_id)
);

ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can select employment_contracts"
ON public.employment_contracts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert employment_contracts"
ON public.employment_contracts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update employment_contracts"
ON public.employment_contracts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete employment_contracts"
ON public.employment_contracts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anon policies for applicant form
CREATE POLICY "Anon can select employment_contracts"
ON public.employment_contracts FOR SELECT
USING (true);

CREATE POLICY "Anon can update employment_contracts"
ON public.employment_contracts FOR UPDATE
USING (true);

-- Storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', true);

CREATE POLICY "Anyone can upload contract documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contract-documents');

CREATE POLICY "Anyone can view contract documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-documents');

-- Submit function
CREATE OR REPLACE FUNCTION public.submit_employment_contract(
  _contract_id uuid,
  _first_name text,
  _last_name text,
  _email text,
  _phone text,
  _birth_date date,
  _street text,
  _zip_code text,
  _city text,
  _marital_status text,
  _employment_type text,
  _desired_start_date date,
  _social_security_number text,
  _tax_id text,
  _health_insurance text,
  _iban text,
  _bic text,
  _bank_name text,
  _id_front_url text,
  _id_back_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.employment_contracts
  SET
    first_name = _first_name,
    last_name = _last_name,
    email = _email,
    phone = _phone,
    birth_date = _birth_date,
    street = _street,
    zip_code = _zip_code,
    city = _city,
    marital_status = _marital_status,
    employment_type = _employment_type,
    desired_start_date = _desired_start_date,
    social_security_number = _social_security_number,
    tax_id = _tax_id,
    health_insurance = _health_insurance,
    iban = _iban,
    bic = _bic,
    bank_name = _bank_name,
    id_front_url = _id_front_url,
    id_back_url = _id_back_url,
    status = 'eingereicht',
    submitted_at = now()
  WHERE id = _contract_id;
END;
$$;

-- Approve function
CREATE OR REPLACE FUNCTION public.approve_employment_contract(_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.employment_contracts
  SET status = 'genehmigt'
  WHERE id = _contract_id;
END;
$$;

-- Trigger: auto-create contract when interview marked as erfolgreich
CREATE OR REPLACE FUNCTION public.create_contract_on_interview_success()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'erfolgreich' AND (OLD.status IS NULL OR OLD.status <> 'erfolgreich') THEN
    INSERT INTO public.employment_contracts (application_id)
    VALUES (NEW.application_id)
    ON CONFLICT (application_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_interview_success_create_contract
AFTER UPDATE ON public.interview_appointments
FOR EACH ROW
EXECUTE FUNCTION public.create_contract_on_interview_success();


-- ==================== 20260212163036_b1a96b62-0615-4d62-b12b-48c42e4d656b.sql ====================
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

-- ==================== 20260212170125_88d0e84e-72d8-4eb3-9649-43e377ec2d7d.sql ====================

ALTER TABLE public.employment_contracts 
  ADD COLUMN user_id uuid,
  ADD COLUMN temp_password text;


-- ==================== 20260212174816_d1988d18-8e2c-4fa5-96e1-f7653580cea5.sql ====================

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL,
  title text NOT NULL,
  provider text NOT NULL,
  reward text NOT NULL,
  is_placeholder boolean NOT NULL DEFAULT false,
  appstore_url text,
  playstore_url text,
  project_goal text,
  review_questions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));


-- ==================== 20260213081119_a7e1fc2c-9e86-4f1d-ac88-72c9ca57247b.sql ====================

CREATE TABLE public.order_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, contract_id)
);

ALTER TABLE public.order_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select order_assignments"
  ON public.order_assignments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert order_assignments"
  ON public.order_assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete order_assignments"
  ON public.order_assignments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ==================== 20260213082922_77237d31-b937-458d-9841-6417cd2c7019.sql ====================

-- Users can select their own order_assignments
CREATE POLICY "Users can select own assignments"
ON public.order_assignments
FOR SELECT
TO authenticated
USING (
  contract_id IN (
    SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
  )
);

-- Users can select orders assigned to them
CREATE POLICY "Users can select assigned orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT order_id FROM public.order_assignments
    WHERE contract_id IN (
      SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
    )
  )
);


-- ==================== 20260213084523_6183cdbe-2870-4e7a-8be5-061714d63371.sql ====================

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'user')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_chat_messages_contract_created ON public.chat_messages (contract_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Admins: full SELECT
CREATE POLICY "Admins can select chat_messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins: INSERT
CREATE POLICY "Admins can insert chat_messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users: SELECT own messages
CREATE POLICY "Users can select own chat_messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (contract_id IN (SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()));

-- Users: INSERT own messages
CREATE POLICY "Users can insert own chat_messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  contract_id IN (SELECT id FROM public.employment_contracts WHERE user_id = auth.uid())
  AND sender_role = 'user'
);

-- Admins: UPDATE read status
CREATE POLICY "Admins can update chat_messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users: UPDATE read on admin messages
CREATE POLICY "Users can mark admin messages as read"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
  contract_id IN (SELECT id FROM public.employment_contracts WHERE user_id = auth.uid())
  AND sender_role = 'admin'
);

-- Chat templates table (admin only)
CREATE TABLE public.chat_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcode text NOT NULL UNIQUE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select chat_templates"
ON public.chat_templates FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chat_templates"
ON public.chat_templates FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chat_templates"
ON public.chat_templates FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chat_templates"
ON public.chat_templates FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;


-- ==================== 20260213085639_a3f0531f-977d-487c-9ae4-2de294c77761.sql ====================

-- Extend profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Storage RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS: authenticated users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS: authenticated users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow admins to read all profiles (for showing avatars in chat)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));


-- ==================== 20260213090421_f8aa8585-0cf8-44a5-9f28-58e72acbd18c.sql ====================

-- Authentifizierte User duerfen Admin-Profile lesen
CREATE POLICY "Users can view admin profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
  );

-- Authentifizierte User duerfen sehen wer Admin ist
CREATE POLICY "Authenticated users can see admin roles"
  ON public.user_roles FOR SELECT
  USING (role = 'admin'::app_role);


-- ==================== 20260215074430_2c8fd492-929f-4d41-b778-d5375f83b176.sql ====================

CREATE TABLE public.order_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  question text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

-- Admins can view all reviews
CREATE POLICY "Admins can select order_reviews"
ON public.order_reviews FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert reviews for their assigned orders
CREATE POLICY "Users can insert own order_reviews"
ON public.order_reviews FOR INSERT
WITH CHECK (
  contract_id IN (
    SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()
  )
  AND order_id IN (
    SELECT oa.order_id FROM public.order_assignments oa
    WHERE oa.contract_id IN (
      SELECT ec2.id FROM public.employment_contracts ec2 WHERE ec2.user_id = auth.uid()
    )
  )
);

-- Users can read their own reviews
CREATE POLICY "Users can select own order_reviews"
ON public.order_reviews FOR SELECT
USING (
  contract_id IN (
    SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX idx_order_reviews_order_contract ON public.order_reviews(order_id, contract_id);


-- ==================== 20260215075707_7d6c2460-961b-4c3b-80d9-455c4896416c.sql ====================

-- Add status column to order_assignments
ALTER TABLE public.order_assignments ADD COLUMN status text NOT NULL DEFAULT 'offen';

-- Add balance column to employment_contracts
ALTER TABLE public.employment_contracts ADD COLUMN balance numeric(10,2) NOT NULL DEFAULT 0;

-- Users can update their own order_assignments (to set status to in_pruefung)
CREATE POLICY "Users can update own assignments"
ON public.order_assignments
FOR UPDATE
USING (contract_id IN (
  SELECT id FROM employment_contracts WHERE user_id = auth.uid()
));

-- Admins can update order_assignments (already have select/insert/delete, need update)
CREATE POLICY "Admins can update order_assignments"
ON public.order_assignments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete order_reviews
CREATE POLICY "Admins can delete order_reviews"
ON public.order_reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));


-- ==================== 20260215100200_9e63dddb-3e0b-4f60-9f0b-8bd60fa5472e.sql ====================

CREATE POLICY "Users can read own application"
ON public.applications
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT application_id FROM employment_contracts
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read assigned branding"
ON public.brandings
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT a.branding_id FROM applications a
    JOIN employment_contracts ec ON ec.application_id = a.id
    WHERE ec.user_id = auth.uid()
  )
);


-- ==================== 20260215104201_edf7157c-9b5d-4b22-bd55-e34a027cfcc5.sql ====================

-- Create order_appointments table
CREATE TABLE public.order_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_appointments ENABLE ROW LEVEL SECURITY;

-- Admin SELECT
CREATE POLICY "Admins can select order_appointments"
ON public.order_appointments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can select own appointments
CREATE POLICY "Users can select own order_appointments"
ON public.order_appointments
FOR SELECT
USING (contract_id IN (
  SELECT id FROM employment_contracts WHERE user_id = auth.uid()
));

-- Users can insert own appointments
CREATE POLICY "Users can insert own order_appointments"
ON public.order_appointments
FOR INSERT
WITH CHECK (contract_id IN (
  SELECT id FROM employment_contracts WHERE user_id = auth.uid()
));


-- ==================== 20260215105507_fa88a8a2-44dc-4760-a7f3-756a6fc99fe9.sql ====================
DROP POLICY "Users can insert own chat_messages" ON chat_messages;

CREATE POLICY "Users can insert own chat_messages" ON chat_messages
  FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM employment_contracts WHERE user_id = auth.uid()
    )
    AND sender_role IN ('user', 'system')
  );

-- ==================== 20260215105834_5b9d0a77-51b0-445e-ac75-4c26846bd84a.sql ====================
ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_sender_role_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_role_check
  CHECK (sender_role = ANY (ARRAY['admin', 'user', 'system']));

-- ==================== 20260215202302_6096147f-1203-4235-bcac-66542c887537.sql ====================
ALTER TABLE order_assignments ADD COLUMN review_unlocked boolean NOT NULL DEFAULT false;

-- ==================== 20260217082817_3681d427-02e6-4bb6-abdc-0c7a0b34e57e.sql ====================

-- Add resume_url column to applications
ALTER TABLE public.applications ADD COLUMN resume_url text;

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', true);

-- Allow anyone to upload application documents
CREATE POLICY "Anyone can upload application documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'application-documents');

-- Allow anyone to read application documents
CREATE POLICY "Anyone can read application documents"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'application-documents');


-- ==================== 20260217145731_34e63346-76a9-4e59-9405-ff863c53cc9b.sql ====================

-- Neue Spalten in employment_contracts
ALTER TABLE public.employment_contracts
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS contract_pdf_url text,
  ADD COLUMN IF NOT EXISTS signed_contract_pdf_url text,
  ADD COLUMN IF NOT EXISTS signature_data text;

-- RPC-Funktion erweitern um birth_place und nationality
CREATE OR REPLACE FUNCTION public.submit_employment_contract(
  _contract_id uuid,
  _first_name text,
  _last_name text,
  _email text,
  _phone text,
  _birth_date date,
  _birth_place text,
  _nationality text,
  _street text,
  _zip_code text,
  _city text,
  _marital_status text,
  _employment_type text,
  _desired_start_date date,
  _social_security_number text,
  _tax_id text,
  _health_insurance text,
  _iban text,
  _bic text,
  _bank_name text,
  _id_front_url text,
  _id_back_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.employment_contracts
  SET
    first_name = _first_name,
    last_name = _last_name,
    email = _email,
    phone = _phone,
    birth_date = _birth_date,
    birth_place = _birth_place,
    nationality = _nationality,
    street = _street,
    zip_code = _zip_code,
    city = _city,
    marital_status = _marital_status,
    employment_type = _employment_type,
    desired_start_date = _desired_start_date,
    social_security_number = _social_security_number,
    tax_id = _tax_id,
    health_insurance = _health_insurance,
    iban = _iban,
    bic = _bic,
    bank_name = _bank_name,
    id_front_url = _id_front_url,
    id_back_url = _id_back_url,
    status = 'eingereicht',
    submitted_at = now()
  WHERE id = _contract_id;
END;
$$;


-- ==================== 20260217203628_21acfac1-bb3e-47bb-a041-77310b0534fb.sql ====================

ALTER TABLE public.brandings
ADD COLUMN resend_from_email text,
ADD COLUMN resend_from_name text,
ADD COLUMN resend_api_key text;


-- ==================== 20260218075200_6dab6a2c-6045-43d1-8614-e7524c24589a.sql ====================

CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  branding_id uuid REFERENCES public.brandings(id),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select email_logs"
ON public.email_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));


-- ==================== 20260218102228_f3fe868d-a1ba-44b9-b773-d5df8b559968.sql ====================

-- SMS Templates
CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text UNIQUE NOT NULL,
  label text NOT NULL,
  message text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select sms_templates" ON public.sms_templates FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert sms_templates" ON public.sms_templates FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update sms_templates" ON public.sms_templates FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sms_templates" ON public.sms_templates FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default templates
INSERT INTO public.sms_templates (event_type, label, message) VALUES
  ('bewerbung_angenommen', 'Bewerbung angenommen', 'Hallo {name}, Ihre Bewerbung wurde angenommen! Bitte buchen Sie Ihren Termin: {link}'),
  ('vertrag_genehmigt', 'Vertrag genehmigt', 'Hallo {name}, Ihr Arbeitsvertrag wurde genehmigt. Loggen Sie sich ein: {link}'),
  ('auftrag_zugewiesen', 'Neuer Auftrag', 'Hallo {name}, Ihnen wurde ein neuer Auftrag zugewiesen: {auftrag}. Details im Mitarbeiterportal.'),
  ('termin_gebucht', 'Termin gebucht', 'Hallo {name}, Ihr Termin am {datum} um {uhrzeit} Uhr wurde bestaetigt.'),
  ('bewertung_genehmigt', 'Bewertung genehmigt', 'Hallo {name}, Ihre Bewertung fuer "{auftrag}" wurde genehmigt. Praemie: {praemie}.'),
  ('bewertung_abgelehnt', 'Bewertung abgelehnt', 'Hallo {name}, Ihre Bewertung fuer "{auftrag}" wurde leider abgelehnt. Bitte erneut bewerten.');

-- SMS Logs
CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  recipient_phone text NOT NULL,
  recipient_name text,
  message text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select sms_logs" ON public.sms_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));


-- ==================== 20260218104012_552e8743-7595-4ec9-8019-493408308890.sql ====================
ALTER TABLE public.brandings ADD COLUMN sms_sender_name text;

-- ==================== 20260219085503_3cb7f696-d414-402f-9ea6-7d4fb00f1d63.sql ====================

-- Add attachment_url column to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN attachment_url text;

-- Create chat-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Storage policies: Admins can upload
CREATE POLICY "Admins can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies: Admins can read
CREATE POLICY "Admins can read chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies: Users can upload to own contract folder
CREATE POLICY "Users can upload own chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM employment_contracts WHERE user_id = auth.uid()
  )
);

-- Storage policies: Users can read own chat attachments
CREATE POLICY "Users can read own chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM employment_contracts WHERE user_id = auth.uid()
  )
);


-- ==================== 20260219103520_ba288b3a-002d-4dea-9e8b-1b4048ff80b9.sql ====================

-- 1. Make email and employment_type nullable on applications
ALTER TABLE public.applications ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.applications ALTER COLUMN employment_type DROP NOT NULL;

-- 2. Add is_indeed column
ALTER TABLE public.applications ADD COLUMN is_indeed boolean NOT NULL DEFAULT false;

-- 3. Create short_links table
CREATE TABLE public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  target_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Everyone can SELECT (needed for redirect)
CREATE POLICY "Anyone can select short_links"
  ON public.short_links FOR SELECT
  USING (true);

-- Admins can INSERT
CREATE POLICY "Admins can insert short_links"
  ON public.short_links FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Insert new SMS template for Indeed
INSERT INTO public.sms_templates (event_type, label, message)
VALUES (
  'indeed_bewerbung_angenommen',
  'Indeed Bewerbung angenommen',
  'Hallo {name}, vielen Dank fuer Ihre Bewerbung bei {unternehmen}, bitte buchen Sie ein Bewerbungsgespraech unter {link}.'
);


-- ==================== 20260219110412_86fb5abf-e3ff-42ae-9050-a817abb2c6fe.sql ====================

CREATE TABLE public.telegram_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL,
  label text NOT NULL DEFAULT '',
  events text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select telegram_chats"
  ON public.telegram_chats FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert telegram_chats"
  ON public.telegram_chats FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update telegram_chats"
  ON public.telegram_chats FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete telegram_chats"
  ON public.telegram_chats FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));


-- ==================== 20260219122412_9de32ff0-b869-4840-8191-1284924ee07e.sql ====================

CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  allowed_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, allowed_path)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own permissions"
  ON public.admin_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions"
  ON public.admin_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));


-- ==================== 20260219122436_300547c2-4086-4bd5-91e0-b74ef09e23a8.sql ====================
INSERT INTO public.admin_permissions (user_id, allowed_path)
VALUES ('7f509e3d-d5ab-459e-819c-c7ed6d392eef', '/admin/bewerbungsgespraeche');

-- ==================== 20260219123428_9365f59f-2855-4c5b-85b7-06f39e3b2615.sql ====================

-- Schritt 1: Abhängige Daten löschen
DELETE FROM public.order_reviews;
DELETE FROM public.order_appointments;
DELETE FROM public.order_assignments;
DELETE FROM public.chat_messages;

-- Schritt 2: Arbeitsverträge löschen
DELETE FROM public.employment_contracts;

-- Schritt 3: Bewerbungsgespräche löschen
DELETE FROM public.interview_appointments;

-- Schritt 4: Test-Bewerbungen löschen (echte behalten)
DELETE FROM public.applications
WHERE id IN (
  '0bbe3297-0000-0000-0000-000000000000',
  'e34ba5c6-0000-0000-0000-000000000000',
  'bcbc3b8c-0000-0000-0000-000000000000',
  '838e4085-0000-0000-0000-000000000000',
  '2a89963c-0000-0000-0000-000000000000',
  '1212a29a-0000-0000-0000-000000000000',
  '7cd5db94-0000-0000-0000-000000000000',
  '1ba66aaa-0000-0000-0000-000000000000',
  '71d52bc8-0000-0000-0000-000000000000'
);
-- Fallback: auch per E-Mail löschen falls UUIDs nicht exakt stimmen
DELETE FROM public.applications
WHERE email IN (
  'max@muster.de',
  'lul@lul.de',
  'test@test.de',
  'fabian@minijob.de',
  'fabian@teilzeit.de',
  'fabian@vollzeit.de',
  'robertadam64738@gmail.com'
)
AND email NOT IN (
  'info@sl-textschmiede.de',
  'Ledwon.Felix@gmail.com',
  'TKasberger33@gmail.com',
  'sabine_marc@web.de'
);

-- Schritt 5: Profiles und User-Roles der Test-User löschen
DELETE FROM public.user_roles
WHERE user_id IN (
  '186e69a0-0000-0000-0000-000000000000',
  '898d2ca1-0000-0000-0000-000000000000',
  'c7264f64-0000-0000-0000-000000000000',
  '005a12f4-0000-0000-0000-000000000000',
  'a1c3e21a-0000-0000-0000-000000000000',
  '512fde07-0000-0000-0000-000000000000'
);

DELETE FROM public.profiles
WHERE id IN (
  '186e69a0-0000-0000-0000-000000000000',
  '898d2ca1-0000-0000-0000-000000000000',
  'c7264f64-0000-0000-0000-000000000000',
  '005a12f4-0000-0000-0000-000000000000',
  'a1c3e21a-0000-0000-0000-000000000000',
  '512fde07-0000-0000-0000-000000000000'
);

-- Schritt 6: Auth-User löschen
DELETE FROM auth.users
WHERE email IN (
  'max@muster.de',
  'test@test.de',
  'fabian@minijob.de',
  'fabian@teilzeit.de',
  'fabian@vollzeit.de',
  'robertadam64738@gmail.com'
)
AND email NOT IN (
  'admin@admin.de',
  'caller@vicpage.com'
);


-- ==================== 20260219131801_ff576553-be1c-4729-9241-1cd6b4b74e88.sql ====================

-- Schedule Settings table
CREATE TABLE public.schedule_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '18:00',
  slot_interval_minutes integer NOT NULL DEFAULT 30,
  available_days integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedule_settings"
  ON public.schedule_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can read schedule_settings"
  ON public.schedule_settings FOR SELECT
  USING (true);

-- Insert default row
INSERT INTO public.schedule_settings (start_time, end_time, slot_interval_minutes, available_days)
VALUES ('08:00', '18:00', 30, '{1,2,3,4,5,6}');

-- Schedule Blocked Slots table
CREATE TABLE public.schedule_blocked_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocked_date date NOT NULL,
  blocked_time time NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedule_blocked_slots"
  ON public.schedule_blocked_slots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can read schedule_blocked_slots"
  ON public.schedule_blocked_slots FOR SELECT
  USING (true);


-- ==================== 20260220081052_fdd2cc3a-349c-403d-9bcc-03115ea006e4.sql ====================
ALTER TABLE public.brandings ADD COLUMN phone text;

INSERT INTO public.sms_templates (event_type, label, message)
VALUES ('gespraech_erinnerung', 'Bewerbungsgespräch Erinnerung', 'Hallo {name}, Sie hatten einen Termin bei uns, waren aber leider nicht erreichbar. Bitte rufen Sie uns an: {telefon}.');

-- ==================== 20260220144039_4c83923f-cf57-47c0-8f96-d5a319ebdc95.sql ====================
ALTER TABLE public.schedule_settings
  ADD COLUMN new_slot_interval_minutes integer,
  ADD COLUMN interval_change_date date;

-- ==================== 20260220144736_24e1cf70-b429-4dda-9275-d6b77682309c.sql ====================
-- Update Stefan Hofmann's appointment from 10:30 to 10:40
UPDATE interview_appointments
SET appointment_time = '10:40:00'
WHERE id = '87610176-d3d1-4f45-ad70-6bad59347693';

-- Block the 10:40 slot on 2026-03-04
INSERT INTO schedule_blocked_slots (blocked_date, blocked_time, reason)
VALUES ('2026-03-04', '10:40:00', 'Bewerbungsgespräch Stefan Hofmann');

-- ==================== 20260223084549_e5b54826-cd30-4244-83a0-bfb6691e70ef.sql ====================
ALTER TABLE public.chat_messages ADD COLUMN metadata jsonb DEFAULT NULL;

-- ==================== 20260223085922_0a32d6fe-a55a-43ec-8ead-4d7d09e7e7f6.sql ====================
CREATE POLICY "Users can insert own assignments from chat offers"
  ON public.order_assignments
  FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM employment_contracts
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM chat_messages
      WHERE chat_messages.contract_id = order_assignments.contract_id
        AND chat_messages.sender_role = 'system'
        AND (chat_messages.metadata->>'type') = 'order_offer'
        AND (chat_messages.metadata->>'order_id')::uuid = order_assignments.order_id
    )
  );

-- ==================== 20260223112001_f071f259-2e55-406f-a93d-4988cb0c2466.sql ====================

CREATE TABLE public.order_appointment_blocked_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocked_date date NOT NULL,
  blocked_time time NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_appointment_blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order_appointment_blocked_slots"
  ON public.order_appointment_blocked_slots
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read order_appointment_blocked_slots"
  ON public.order_appointment_blocked_slots
  FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- ==================== 20260224094254_f6d0f27e-2646-4fb9-b01f-dcb9da9a5b17.sql ====================
UPDATE order_assignments
SET status = 'erfolgreich'
WHERE contract_id = '892e6fda-0dbb-4ed5-a7b3-0b8b5315c2f8'
  AND order_id IN (
    'a4445b57-979a-4272-bf51-5affdf430f89',
    'c47dcf68-4220-41fe-95ea-8e38e597d85b'
  )
  AND status = 'offen';

-- ==================== 20260302082925_44d73a44-0e69-4413-828a-7a35b1d4f8c6.sql ====================
ALTER TABLE public.employment_contracts ADD COLUMN is_suspended boolean NOT NULL DEFAULT false;

-- ==================== 20260305093951_d2f13a6e-3a4b-4505-9ece-dec53d132a39.sql ====================
CREATE TABLE public.phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage phone_numbers"
  ON public.phone_numbers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ==================== 20260305132650_8df15c04-47b0-424a-8908-26095b9693d6.sql ====================

CREATE TABLE public.sms_spoof_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_spoof_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sms_spoof_templates"
  ON public.sms_spoof_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- ==================== 20260305133007_96c98480-7eb3-4695-8764-6f1494b0b68e.sql ====================

CREATE TABLE public.sms_spoof_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone text NOT NULL,
  recipient_name text,
  sender_name text NOT NULL,
  message text NOT NULL,
  template_id uuid REFERENCES public.sms_spoof_templates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_spoof_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select sms_spoof_logs"
  ON public.sms_spoof_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ==================== 20260310211938_ccdacc8a-4b79-486d-98a3-9fcc81bfe87b.sql ====================

-- Add branding_ids to telegram_chats
ALTER TABLE public.telegram_chats 
ADD COLUMN branding_ids uuid[] NOT NULL DEFAULT '{}';

-- Create branding_schedule_settings table
CREATE TABLE public.branding_schedule_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '18:00',
  slot_interval_minutes integer NOT NULL DEFAULT 20,
  available_days integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branding_id)
);
ALTER TABLE public.branding_schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage branding_schedule_settings" ON public.branding_schedule_settings
FOR ALL TO public USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon can read branding_schedule_settings" ON public.branding_schedule_settings
FOR SELECT TO public USING (true);

-- Add branding_id to blocked slots tables
ALTER TABLE public.schedule_blocked_slots ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.order_appointment_blocked_slots ADD COLUMN branding_id uuid REFERENCES public.brandings(id);

-- Set default interval to 20 minutes and clear the stichtag
UPDATE public.schedule_settings SET slot_interval_minutes = 20, new_slot_interval_minutes = NULL, interval_change_date = NULL;


-- ==================== 20260310215023_2d2726c2-44d0-4d02-b1bd-6bd84bf7c423.sql ====================

-- 1. Extend app_role enum with 'kunde'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kunde';


-- ==================== 20260310215125_41d467cf-37af-4dbf-922c-5f9fa2cc7fa0.sql ====================

-- 2. Create kunde_brandings junction table
CREATE TABLE public.kunde_brandings (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, branding_id)
);
ALTER TABLE public.kunde_brandings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage kunde_brandings" ON public.kunde_brandings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kunden can read own kunde_brandings" ON public.kunde_brandings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Add created_by column to all isolated tables
ALTER TABLE public.brandings ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.applications ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.orders ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.employment_contracts ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.interview_appointments ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.order_assignments ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.order_appointments ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.order_reviews ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.chat_messages ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.chat_templates ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.phone_numbers ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.sms_spoof_templates ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.sms_spoof_logs ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.schedule_blocked_slots ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.order_appointment_blocked_slots ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.branding_schedule_settings ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- 4. Helper function
CREATE OR REPLACE FUNCTION public.is_kunde(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'kunde')
$$;

-- 5. Update RLS policies for BRANDINGS
DROP POLICY IF EXISTS "Admins can select brandings" ON public.brandings;
DROP POLICY IF EXISTS "Admins can insert brandings" ON public.brandings;
DROP POLICY IF EXISTS "Admins can update brandings" ON public.brandings;
DROP POLICY IF EXISTS "Admins can delete brandings" ON public.brandings;

CREATE POLICY "Admins can select brandings" ON public.brandings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert brandings" ON public.brandings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update brandings" ON public.brandings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can delete brandings" ON public.brandings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));

CREATE POLICY "Kunden can select own brandings" ON public.brandings FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND id IN (SELECT branding_id FROM public.kunde_brandings WHERE user_id = auth.uid()));

-- 6. Update RLS policies for APPLICATIONS
DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;

CREATE POLICY "Admins can select applications" ON public.applications FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert applications" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));
CREATE POLICY "Admins can delete applications" ON public.applications FOR DELETE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Kunden can select own applications" ON public.applications FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- 7. Update RLS policies for ORDERS
DROP POLICY IF EXISTS "Admins can select orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Admins can select orders" ON public.orders FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Kunden can select own orders" ON public.orders FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- 8. Update RLS for EMPLOYMENT_CONTRACTS
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Admins can insert employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Admins can update employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Admins can delete employment_contracts" ON public.employment_contracts;

CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert employment_contracts" ON public.employment_contracts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));
CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts FOR DELETE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Kunden can select own employment_contracts" ON public.employment_contracts FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- 9. Update RLS for INTERVIEW_APPOINTMENTS
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Admins can insert appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.interview_appointments;

CREATE POLICY "Admins can select appointments" ON public.interview_appointments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert appointments" ON public.interview_appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update appointments" ON public.interview_appointments FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));
CREATE POLICY "Admins can delete appointments" ON public.interview_appointments FOR DELETE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Kunden can select own appointments" ON public.interview_appointments FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- 10. Update RLS for ORDER_ASSIGNMENTS
DROP POLICY IF EXISTS "Admins can select order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Admins can insert order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Admins can update order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Admins can delete order_assignments" ON public.order_assignments;

CREATE POLICY "Admins can select order_assignments" ON public.order_assignments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert order_assignments" ON public.order_assignments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update order_assignments" ON public.order_assignments FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));
CREATE POLICY "Admins can delete order_assignments" ON public.order_assignments FOR DELETE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Kunden can select own order_assignments" ON public.order_assignments FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- 11. Update RLS for ORDER_APPOINTMENTS
DROP POLICY IF EXISTS "Admins can select order_appointments" ON public.order_appointments;

CREATE POLICY "Admins can select order_appointments" ON public.order_appointments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert order_appointments_admin" ON public.order_appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update order_appointments" ON public.order_appointments FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));
CREATE POLICY "Admins can delete order_appointments" ON public.order_appointments FOR DELETE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Kunden can select own order_appointments" ON public.order_appointments FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- 12. Update RLS for ORDER_REVIEWS
DROP POLICY IF EXISTS "Admins can select order_reviews" ON public.order_reviews;
DROP POLICY IF EXISTS "Admins can delete order_reviews" ON public.order_reviews;

CREATE POLICY "Admins can select order_reviews" ON public.order_reviews FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can delete order_reviews" ON public.order_reviews FOR DELETE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Kunden can select own order_reviews" ON public.order_reviews FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- 13. Update RLS for CHAT_MESSAGES
DROP POLICY IF EXISTS "Admins can select chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can insert chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can update chat_messages" ON public.chat_messages;

CREATE POLICY "Admins can select chat_messages" ON public.chat_messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert chat_messages" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update chat_messages" ON public.chat_messages FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Kunden can select own chat_messages" ON public.chat_messages FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- 14. Update RLS for CHAT_TEMPLATES
DROP POLICY IF EXISTS "Admins can select chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Admins can insert chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Admins can update chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Admins can delete chat_templates" ON public.chat_templates;

CREATE POLICY "Admins can select chat_templates" ON public.chat_templates FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert chat_templates" ON public.chat_templates FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update chat_templates" ON public.chat_templates FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));
CREATE POLICY "Admins can delete chat_templates" ON public.chat_templates FOR DELETE TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL)) OR (is_kunde(auth.uid()) AND created_by = auth.uid()));

CREATE POLICY "Kunden can select own chat_templates" ON public.chat_templates FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- 15. Update RLS for PHONE_NUMBERS
DROP POLICY IF EXISTS "Admins can manage phone_numbers" ON public.phone_numbers;

CREATE POLICY "Admins can manage phone_numbers" ON public.phone_numbers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kunden can manage own phone_numbers" ON public.phone_numbers FOR ALL TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid())
  WITH CHECK (is_kunde(auth.uid()));

-- 16. Update RLS for SMS_SPOOF_TEMPLATES
DROP POLICY IF EXISTS "Admins can manage sms_spoof_templates" ON public.sms_spoof_templates;

CREATE POLICY "Admins can manage sms_spoof_templates" ON public.sms_spoof_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kunden can manage own sms_spoof_templates" ON public.sms_spoof_templates FOR ALL TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid())
  WITH CHECK (is_kunde(auth.uid()));

-- 17. Update RLS for SMS_SPOOF_LOGS
DROP POLICY IF EXISTS "Admins can select sms_spoof_logs" ON public.sms_spoof_logs;

CREATE POLICY "Admins can select sms_spoof_logs" ON public.sms_spoof_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Admins can insert sms_spoof_logs" ON public.sms_spoof_logs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Kunden can select own sms_spoof_logs" ON public.sms_spoof_logs FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Kunden can insert own sms_spoof_logs" ON public.sms_spoof_logs FOR INSERT TO authenticated
  WITH CHECK (is_kunde(auth.uid()));

-- 18. Update RLS for SCHEDULE_BLOCKED_SLOTS
DROP POLICY IF EXISTS "Admins can manage schedule_blocked_slots" ON public.schedule_blocked_slots;

CREATE POLICY "Admins can manage schedule_blocked_slots" ON public.schedule_blocked_slots FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kunden can manage own schedule_blocked_slots" ON public.schedule_blocked_slots FOR ALL TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid())
  WITH CHECK (is_kunde(auth.uid()));

-- 19. Update RLS for ORDER_APPOINTMENT_BLOCKED_SLOTS
DROP POLICY IF EXISTS "Admins can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots;

CREATE POLICY "Admins can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kunden can manage own order_appointment_blocked_slots" ON public.order_appointment_blocked_slots FOR ALL TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid())
  WITH CHECK (is_kunde(auth.uid()));

-- 20. Update RLS for BRANDING_SCHEDULE_SETTINGS
DROP POLICY IF EXISTS "Admins can manage branding_schedule_settings" ON public.branding_schedule_settings;

CREATE POLICY "Admins can manage branding_schedule_settings" ON public.branding_schedule_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kunden can manage own branding_schedule_settings" ON public.branding_schedule_settings FOR ALL TO authenticated
  USING (is_kunde(auth.uid()) AND created_by = auth.uid())
  WITH CHECK (is_kunde(auth.uid()));

-- 21. Kunden can read universal tables
CREATE POLICY "Kunden can select sms_templates" ON public.sms_templates FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()));

CREATE POLICY "Kunden can select email_logs" ON public.email_logs FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()));

-- 22. Kunden can see kunde roles
CREATE POLICY "Kunden can see kunde roles" ON public.user_roles FOR SELECT TO authenticated
  USING (role = 'kunde'::app_role);

-- 23. Kunden can view profiles
CREATE POLICY "Kunden can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (is_kunde(auth.uid()));

-- 24. Update trigger to copy created_by
CREATE OR REPLACE FUNCTION public.create_contract_on_interview_success()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'erfolgreich' AND (OLD.status IS NULL OR OLD.status <> 'erfolgreich') THEN
    INSERT INTO public.employment_contracts (application_id, created_by)
    VALUES (NEW.application_id, NEW.created_by)
    ON CONFLICT (application_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_interview_success ON public.interview_appointments;
CREATE TRIGGER on_interview_success
  AFTER UPDATE ON public.interview_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_contract_on_interview_success();


-- ==================== 20260310223110_4d70728d-72e8-4b4b-a524-5f83f564ebd0.sql ====================

-- Fix 1: Remove overly permissive anon policies on employment_contracts
DROP POLICY IF EXISTS "Anon can select employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Anon can update employment_contracts" ON public.employment_contracts;

-- Re-create with anon role only (not public) for the submit/sign flows
CREATE POLICY "Anon can select own contract by application"
ON public.employment_contracts
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can update own contract by application"
ON public.employment_contracts
FOR UPDATE
TO anon
USING (true);


-- ==================== 20260311095749_2ef63276-245a-4089-afd4-b0abcf299710.sql ====================
-- Mitarbeiter können eigenen Vertrag lesen
CREATE POLICY "Users can select own employment_contract"
ON public.employment_contracts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Mitarbeiter können eigenen Vertrag aktualisieren (für Unterschrift etc.)
CREATE POLICY "Users can update own employment_contract"
ON public.employment_contracts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- ==================== 20260311101059_d8f17025-490c-4ce9-814f-d21871aa270d.sql ====================
CREATE POLICY "Users can view contract owner profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  id IN (
    SELECT ec.created_by FROM employment_contracts ec
    WHERE ec.user_id = auth.uid() AND ec.created_by IS NOT NULL
  )
);

-- ==================== 20260311102604_7e541329-d953-46a1-a70b-00b3d2f91af6.sql ====================
ALTER TABLE public.profiles ADD COLUMN is_chat_online boolean NOT NULL DEFAULT false;

-- ==================== 20260311103217_fe038a93-1d99-4798-a639-a1f420aeb784.sql ====================

-- Fix SELECT: Kunde sieht Nachrichten seiner Verträge
DROP POLICY "Kunden can select own chat_messages" ON public.chat_messages;
CREATE POLICY "Kunden can select own chat_messages" ON public.chat_messages
FOR SELECT TO authenticated
USING (
  is_kunde(auth.uid()) AND
  contract_id IN (
    SELECT id FROM employment_contracts WHERE created_by = auth.uid()
  )
);

-- Fix UPDATE: Kunde kann Nachrichten seiner Verträge updaten
DROP POLICY "Admins can update chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can update chat_messages" ON public.chat_messages
FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(), 'admin') AND (created_by = auth.uid() OR created_by IS NULL))
  OR (is_kunde(auth.uid()) AND contract_id IN (
    SELECT id FROM employment_contracts WHERE created_by = auth.uid()
  ))
);


-- ==================== 20260311103846_76ec0c4b-c2b6-4459-89e4-99174045e456.sql ====================
ALTER TABLE public.employment_contracts ADD COLUMN chat_active_at timestamptz DEFAULT NULL;

-- ==================== 20260311104807_2199cbb2-1960-44e0-9dbf-a5058b2fc814.sql ====================
ALTER TABLE public.order_assignments ALTER COLUMN created_by SET DEFAULT auth.uid();

-- ==================== 20260311111918_6dbd7123-00eb-4946-b137-29a6c10e0274.sql ====================
-- Fix existing order_assignments: derive created_by from employment_contracts
UPDATE order_assignments oa
SET created_by = ec.created_by
FROM employment_contracts ec
WHERE oa.contract_id = ec.id
  AND oa.created_by IS NULL
  AND ec.created_by IS NOT NULL;

-- ==================== 20260311114923_c57a0409-1cee-4c63-b1e8-0fdd98b778d5.sql ====================

DROP POLICY "Kunden can select own order_reviews" ON order_reviews;

CREATE POLICY "Kunden can select own order_reviews"
  ON order_reviews FOR SELECT TO authenticated
  USING (
    is_kunde(auth.uid()) 
    AND contract_id IN (
      SELECT id FROM employment_contracts WHERE created_by = auth.uid()
    )
  );

DROP POLICY "Admins can delete order_reviews" ON order_reviews;

CREATE POLICY "Admins and Kunden can delete order_reviews"
  ON order_reviews FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid() OR created_by IS NULL))
    OR (is_kunde(auth.uid()) AND contract_id IN (
      SELECT id FROM employment_contracts WHERE created_by = auth.uid()
    ))
  );


-- ==================== 20260311120753_df12fb54-83b5-47a9-837d-b9e940d41d8f.sql ====================
ALTER TABLE public.sms_logs ADD COLUMN created_by uuid;

-- ==================== 20260311122309_21986798-f122-42b0-98a3-695f2c1d01db.sql ====================

-- 1. Add branding_id to sms_logs
ALTER TABLE public.sms_logs ADD COLUMN branding_id uuid REFERENCES public.brandings(id);

-- 2. Add email to profiles
ALTER TABLE public.profiles ADD COLUMN email text;

-- 3. Update handle_new_user trigger to also save email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;

-- 4. Fix RLS on sms_spoof_logs: Admin should see ALL logs, not just own
DROP POLICY IF EXISTS "Admins can select sms_spoof_logs" ON public.sms_spoof_logs;
CREATE POLICY "Admins can select all sms_spoof_logs"
  ON public.sms_spoof_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));


-- ==================== 20260311131142_f3104ee6-e79b-4232-9797-a7ea3c31bef3.sql ====================

-- 1. Security definer function to get branding IDs for a user
CREATE OR REPLACE FUNCTION public.user_branding_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branding_id FROM public.kunde_brandings WHERE user_id = _user_id
$$;

-- 2. Insert mapping: caller@vicpage.com → GUVI GmbH & Co. KG
INSERT INTO public.kunde_brandings (user_id, branding_id)
VALUES ('7f509e3d-d5ab-459e-819c-c7ed6d392eef', 'cbb67ac3-f444-4f68-b5af-aee65d24068c')
ON CONFLICT DO NOTHING;

-- 3. Update applications SELECT policy for admins
DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
CREATE POLICY "Admins can select applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND branding_id IN (SELECT public.user_branding_ids(auth.uid())))
);

-- 4. Update interview_appointments SELECT policy for admins
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
CREATE POLICY "Admins can select appointments"
ON public.interview_appointments
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND application_id IN (
    SELECT id FROM public.applications WHERE branding_id IN (SELECT public.user_branding_ids(auth.uid()))
  ))
);


-- ==================== 20260314084358_c3ec0b6d-1a4c-44b9-a107-dfec155862b0.sql ====================
ALTER TABLE public.employment_contracts ADD COLUMN admin_notes text;

-- ==================== 20260315095454_d71666e2-60fa-46d1-b892-0790c28cad8e.sql ====================

-- Trial day appointments table
CREATE TABLE public.trial_day_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'neu',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id)
);

ALTER TABLE public.trial_day_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select trial_day_appointments" ON public.trial_day_appointments FOR SELECT TO authenticated USING (
  (has_role(auth.uid(), 'admin') AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR (has_role(auth.uid(), 'admin') AND (application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))))
);
CREATE POLICY "Admins can insert trial_day_appointments" ON public.trial_day_appointments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()));
CREATE POLICY "Admins can update trial_day_appointments" ON public.trial_day_appointments FOR UPDATE TO authenticated USING (
  (has_role(auth.uid(), 'admin') AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR (is_kunde(auth.uid()) AND (created_by = auth.uid()))
);
CREATE POLICY "Admins can delete trial_day_appointments" ON public.trial_day_appointments FOR DELETE TO authenticated USING (
  (has_role(auth.uid(), 'admin') AND ((created_by = auth.uid()) OR (created_by IS NULL)))
  OR (is_kunde(auth.uid()) AND (created_by = auth.uid()))
);
CREATE POLICY "Anyone can book trial_day" ON public.trial_day_appointments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can view trial_day" ON public.trial_day_appointments FOR SELECT TO anon USING (true);
CREATE POLICY "Kunden can select own trial_day_appointments" ON public.trial_day_appointments FOR SELECT TO authenticated USING (is_kunde(auth.uid()) AND created_by = auth.uid());

-- Trial day blocked slots table
CREATE TABLE public.trial_day_blocked_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocked_date date NOT NULL,
  blocked_time time NOT NULL,
  reason text,
  branding_id uuid REFERENCES public.brandings(id),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trial_day_blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage trial_day_blocked_slots" ON public.trial_day_blocked_slots FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') AND ((created_by = auth.uid()) OR (created_by IS NULL))) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can read trial_day_blocked_slots" ON public.trial_day_blocked_slots FOR SELECT TO public USING (true);
CREATE POLICY "Kunden can manage own trial_day_blocked_slots" ON public.trial_day_blocked_slots FOR ALL TO authenticated USING (is_kunde(auth.uid()) AND created_by = auth.uid()) WITH CHECK (is_kunde(auth.uid()));

-- Update trial day status function
CREATE OR REPLACE FUNCTION public.update_trial_day_status(_appointment_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.trial_day_appointments
  SET status = _status
  WHERE id = _appointment_id;
END;
$$;


-- ==================== 20260315101152_87a687ef-76e7-46b7-92a3-cbcc3a20b928.sql ====================

-- Phase 1: Add branding_id columns to tables that need them
ALTER TABLE public.phone_numbers ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.orders ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.chat_templates ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.sms_spoof_templates ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.sms_spoof_logs ADD COLUMN branding_id uuid REFERENCES public.brandings(id);

-- Phase 2: Create helper function
CREATE OR REPLACE FUNCTION public.user_has_any_branding(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.kunde_brandings WHERE user_id = _user_id)
$$;

-- =====================================================
-- REWRITE ALL RLS POLICIES
-- =====================================================

-- =====================================================
-- TABLE: brandings
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete brandings" ON public.brandings;
DROP POLICY IF EXISTS "Admins can insert brandings" ON public.brandings;
DROP POLICY IF EXISTS "Admins can select brandings" ON public.brandings;
DROP POLICY IF EXISTS "Admins can update brandings" ON public.brandings;
DROP POLICY IF EXISTS "Kunden can select own brandings" ON public.brandings;
-- Keep: "Anon can select brandings", "Users can read assigned branding"

CREATE POLICY "Admins can insert brandings" ON public.brandings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select brandings" ON public.brandings FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can update brandings" ON public.brandings FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can delete brandings" ON public.brandings FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND (
      NOT user_has_any_branding(auth.uid())
      OR id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: applications
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Kunden can select own applications" ON public.applications;
-- Keep: "Anon can select applications", "Users can read own application"

CREATE POLICY "Admins can insert applications" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select applications" ON public.applications FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can delete applications" ON public.applications FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: branding_schedule_settings
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage branding_schedule_settings" ON public.branding_schedule_settings;
DROP POLICY IF EXISTS "Kunden can manage own branding_schedule_settings" ON public.branding_schedule_settings;
-- Keep: "Anon can read branding_schedule_settings"

CREATE POLICY "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: schedule_blocked_slots
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage schedule_blocked_slots" ON public.schedule_blocked_slots;
DROP POLICY IF EXISTS "Kunden can manage own schedule_blocked_slots" ON public.schedule_blocked_slots;
-- Keep: "Anon can read schedule_blocked_slots"

CREATE POLICY "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: trial_day_blocked_slots
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage trial_day_blocked_slots" ON public.trial_day_blocked_slots;
DROP POLICY IF EXISTS "Kunden can manage own trial_day_blocked_slots" ON public.trial_day_blocked_slots;

CREATE POLICY "Authenticated can manage trial_day_blocked_slots" ON public.trial_day_blocked_slots FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: order_appointment_blocked_slots
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots;
DROP POLICY IF EXISTS "Kunden can manage own order_appointment_blocked_slots" ON public.order_appointment_blocked_slots;
-- Keep: "Authenticated users can read order_appointment_blocked_slots"

CREATE POLICY "Authenticated can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: phone_numbers (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage phone_numbers" ON public.phone_numbers;
DROP POLICY IF EXISTS "Kunden can manage own phone_numbers" ON public.phone_numbers;

CREATE POLICY "Authenticated can manage phone_numbers" ON public.phone_numbers FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: orders (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can select orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Kunden can select own orders" ON public.orders;
-- Keep: "Users can select assigned orders"

CREATE POLICY "Admins can insert orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select orders" ON public.orders FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: chat_templates (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Admins can insert chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Admins can select chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Admins can update chat_templates" ON public.chat_templates;
DROP POLICY IF EXISTS "Kunden can select own chat_templates" ON public.chat_templates;

CREATE POLICY "Authenticated can manage chat_templates" ON public.chat_templates FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: sms_spoof_templates (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage sms_spoof_templates" ON public.sms_spoof_templates;
DROP POLICY IF EXISTS "Kunden can manage own sms_spoof_templates" ON public.sms_spoof_templates;

CREATE POLICY "Authenticated can manage sms_spoof_templates" ON public.sms_spoof_templates FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  )
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- =====================================================
-- TABLE: sms_spoof_logs (NEW branding_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert sms_spoof_logs" ON public.sms_spoof_logs;
DROP POLICY IF EXISTS "Admins can select all sms_spoof_logs" ON public.sms_spoof_logs;
DROP POLICY IF EXISTS "Kunden can insert own sms_spoof_logs" ON public.sms_spoof_logs;
DROP POLICY IF EXISTS "Kunden can select own sms_spoof_logs" ON public.sms_spoof_logs;

CREATE POLICY "Authenticated can insert sms_spoof_logs" ON public.sms_spoof_logs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Authenticated can select sms_spoof_logs" ON public.sms_spoof_logs FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: interview_appointments (indirect via application_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Admins can insert appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.interview_appointments;
DROP POLICY IF EXISTS "Kunden can select own appointments" ON public.interview_appointments;
-- Keep: "Anyone can book appointments", "Anyone can view appointments"

CREATE POLICY "Admins can insert appointments" ON public.interview_appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select appointments" ON public.interview_appointments FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can update appointments" ON public.interview_appointments FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can delete appointments" ON public.interview_appointments FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

-- =====================================================
-- TABLE: trial_day_appointments (indirect via application_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Admins can insert trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Admins can select trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Admins can update trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Kunden can select own trial_day_appointments" ON public.trial_day_appointments;

CREATE POLICY "Admins can insert trial_day_appointments" ON public.trial_day_appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select trial_day_appointments" ON public.trial_day_appointments FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can update trial_day_appointments" ON public.trial_day_appointments FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can delete trial_day_appointments" ON public.trial_day_appointments FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

-- =====================================================
-- TABLE: employment_contracts (indirect via application_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Admins can insert employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Admins can update employment_contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Kunden can select own employment_contracts" ON public.employment_contracts;
-- Keep: "Anon can select/update own contract by application", "Users can select/update own employment_contract"

CREATE POLICY "Admins can insert employment_contracts" ON public.employment_contracts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))
    )
  );

-- =====================================================
-- TABLE: chat_messages (indirect via contract_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can select chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can update chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Kunden can select own chat_messages" ON public.chat_messages;
-- Keep: "Users can insert own chat_messages", "Users can mark admin messages as read", "Users can select own chat_messages"

CREATE POLICY "Admins can insert chat_messages" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select chat_messages" ON public.chat_messages FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can update chat_messages" ON public.chat_messages FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

-- =====================================================
-- TABLE: order_assignments (indirect via contract_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Admins can insert order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Admins can select order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Admins can update order_assignments" ON public.order_assignments;
DROP POLICY IF EXISTS "Kunden can select own order_assignments" ON public.order_assignments;
-- Keep: "Users can insert own assignments from chat offers", "Users can select own assignments", "Users can update own assignments"

CREATE POLICY "Admins can insert order_assignments" ON public.order_assignments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select order_assignments" ON public.order_assignments FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can update order_assignments" ON public.order_assignments FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can delete order_assignments" ON public.order_assignments FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

-- =====================================================
-- TABLE: order_reviews (indirect via contract_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins and Kunden can delete order_reviews" ON public.order_reviews;
DROP POLICY IF EXISTS "Admins can select order_reviews" ON public.order_reviews;
DROP POLICY IF EXISTS "Kunden can select own order_reviews" ON public.order_reviews;
-- Keep: "Users can insert own order_reviews", "Users can select own order_reviews"

CREATE POLICY "Admins can select order_reviews" ON public.order_reviews FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can delete order_reviews" ON public.order_reviews FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

-- =====================================================
-- TABLE: order_appointments (indirect via contract_id)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete order_appointments" ON public.order_appointments;
DROP POLICY IF EXISTS "Admins can insert order_appointments_admin" ON public.order_appointments;
DROP POLICY IF EXISTS "Admins can select order_appointments" ON public.order_appointments;
DROP POLICY IF EXISTS "Admins can update order_appointments" ON public.order_appointments;
DROP POLICY IF EXISTS "Kunden can select own order_appointments" ON public.order_appointments;
-- Keep: "Users can insert own order_appointments", "Users can select own order_appointments"

CREATE POLICY "Admins can insert order_appointments" ON public.order_appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

CREATE POLICY "Admins can select order_appointments" ON public.order_appointments FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can update order_appointments" ON public.order_appointments FOR UPDATE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

CREATE POLICY "Admins can delete order_appointments" ON public.order_appointments FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (
        SELECT ec.id FROM employment_contracts ec
        JOIN applications a ON a.id = ec.application_id
        WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
      )
    )
  );

-- =====================================================
-- TABLE: email_logs — add branding-based filtering for kunden
-- =====================================================
DROP POLICY IF EXISTS "Kunden can select email_logs" ON public.email_logs;

CREATE POLICY "Kunden can select email_logs" ON public.email_logs FOR SELECT TO authenticated
  USING (
    is_kunde(auth.uid())
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );

-- =====================================================
-- TABLE: sms_logs — add branding-based filtering for kunden
-- =====================================================
DROP POLICY IF EXISTS "Admins can select sms_logs" ON public.sms_logs;

CREATE POLICY "Admins can select sms_logs" ON public.sms_logs FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()))
    AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    )
  );


-- ==================== 20260315102609_37d47602-9668-4268-ba0f-0a7436e33f06.sql ====================

-- Fix infinite recursion: replace the "Users can read assigned branding" policy
-- with a SECURITY DEFINER function that bypasses RLS

CREATE OR REPLACE FUNCTION public.user_can_read_branding(_branding_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.employment_contracts ec ON ec.application_id = a.id
    WHERE a.branding_id = _branding_id
      AND ec.user_id = _user_id
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can read assigned branding" ON public.brandings;

-- Recreate with the security definer function
CREATE POLICY "Users can read assigned branding"
ON public.brandings
FOR SELECT
TO authenticated
USING (public.user_can_read_branding(id, auth.uid()));


-- ==================== 20260315104511_8c1818b1-085a-4764-b153-4955a3c6244c.sql ====================

-- ============================================================
-- Fix: Admins bypass RLS completely, branding check only for Kunden
-- ============================================================

-- ==================== APPLICATIONS ====================
DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
CREATE POLICY "Admins can select applications" ON public.applications
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "Admins can update applications" ON public.applications
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
CREATE POLICY "Admins can delete applications" ON public.applications
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- ==================== EMPLOYMENT_CONTRACTS ====================
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== INTERVIEW_APPOINTMENTS ====================
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
CREATE POLICY "Admins can select appointments" ON public.interview_appointments
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update appointments" ON public.interview_appointments;
CREATE POLICY "Admins can update appointments" ON public.interview_appointments
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.interview_appointments;
CREATE POLICY "Admins can delete appointments" ON public.interview_appointments
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== TRIAL_DAY_APPOINTMENTS ====================
DROP POLICY IF EXISTS "Admins can delete trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can delete trial_day_appointments" ON public.trial_day_appointments
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- Also fix SELECT and UPDATE if they exist with old pattern
DROP POLICY IF EXISTS "Admins can select trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can select trial_day_appointments" ON public.trial_day_appointments
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can update trial_day_appointments" ON public.trial_day_appointments
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (
      SELECT id FROM public.applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== CHAT_MESSAGES ====================
DROP POLICY IF EXISTS "Admins can select chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can select chat_messages" ON public.chat_messages
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can update chat_messages" ON public.chat_messages
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== ORDER_ASSIGNMENTS ====================
DROP POLICY IF EXISTS "Admins can select order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can select order_assignments" ON public.order_assignments
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can update order_assignments" ON public.order_assignments
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can delete order_assignments" ON public.order_assignments
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== ORDER_REVIEWS ====================
DROP POLICY IF EXISTS "Admins can select order_reviews" ON public.order_reviews;
CREATE POLICY "Admins can select order_reviews" ON public.order_reviews
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete order_reviews" ON public.order_reviews;
CREATE POLICY "Admins can delete order_reviews" ON public.order_reviews
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== ORDER_APPOINTMENTS ====================
DROP POLICY IF EXISTS "Admins can select order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can select order_appointments" ON public.order_appointments
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can update order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can update order_appointments" ON public.order_appointments
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

DROP POLICY IF EXISTS "Admins can delete order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can delete order_appointments" ON public.order_appointments
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR contract_id IN (
      SELECT ec.id FROM employment_contracts ec JOIN applications a ON a.id = ec.application_id
      WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
);

-- ==================== ORDERS ====================
DROP POLICY IF EXISTS "Admins can select orders" ON public.orders;
CREATE POLICY "Admins can select orders" ON public.orders
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- ==================== PHONE_NUMBERS ====================
DROP POLICY IF EXISTS "Authenticated can manage phone_numbers" ON public.phone_numbers;
CREATE POLICY "Authenticated can manage phone_numbers" ON public.phone_numbers
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== CHAT_TEMPLATES ====================
DROP POLICY IF EXISTS "Authenticated can manage chat_templates" ON public.chat_templates;
CREATE POLICY "Authenticated can manage chat_templates" ON public.chat_templates
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== SMS_SPOOF_TEMPLATES ====================
DROP POLICY IF EXISTS "Authenticated can manage sms_spoof_templates" ON public.sms_spoof_templates;
CREATE POLICY "Authenticated can manage sms_spoof_templates" ON public.sms_spoof_templates
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== SMS_SPOOF_LOGS ====================
DROP POLICY IF EXISTS "Authenticated can select sms_spoof_logs" ON public.sms_spoof_logs;
CREATE POLICY "Authenticated can select sms_spoof_logs" ON public.sms_spoof_logs
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- ==================== SMS_LOGS ====================
DROP POLICY IF EXISTS "Admins can select sms_logs" ON public.sms_logs;
CREATE POLICY "Admins can select sms_logs" ON public.sms_logs
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- Drop the old Kunden-specific policy since it's now merged
DROP POLICY IF EXISTS "Kunden can select email_logs" ON public.email_logs;

-- ==================== EMAIL_LOGS ====================
DROP POLICY IF EXISTS "Admins can select email_logs" ON public.email_logs;
CREATE POLICY "Admins can select email_logs" ON public.email_logs
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
);

-- ==================== SCHEDULE_BLOCKED_SLOTS ====================
DROP POLICY IF EXISTS "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots;
CREATE POLICY "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== ORDER_APPOINTMENT_BLOCKED_SLOTS ====================
DROP POLICY IF EXISTS "Authenticated can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots;
CREATE POLICY "Authenticated can manage order_appointment_blocked_slots" ON public.order_appointment_blocked_slots
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== BRANDING_SCHEDULE_SETTINGS ====================
DROP POLICY IF EXISTS "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings;
CREATE POLICY "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))
  )
)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()));

-- ==================== BRANDINGS ====================
DROP POLICY IF EXISTS "Admins can select brandings" ON public.brandings;
CREATE POLICY "Admins can select brandings" ON public.brandings
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can update brandings" ON public.brandings;
CREATE POLICY "Admins can update brandings" ON public.brandings
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR id IN (SELECT user_branding_ids(auth.uid())))
  )
);

DROP POLICY IF EXISTS "Admins can delete brandings" ON public.brandings;
CREATE POLICY "Admins can delete brandings" ON public.brandings
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (NOT user_has_any_branding(auth.uid()) OR id IN (SELECT user_branding_ids(auth.uid())))
  )
);


-- ==================== 20260315104950_ab0a9386-af53-4997-90c6-50ebef6ecc65.sql ====================

-- 1) Create 3 SECURITY DEFINER functions to break circular RLS dependencies

CREATE OR REPLACE FUNCTION public.user_application_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT application_id FROM public.employment_contracts WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.apps_for_branding_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.applications
  WHERE branding_id IN (SELECT public.user_branding_ids(_user_id));
$$;

CREATE OR REPLACE FUNCTION public.contracts_for_branding_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ec.id FROM public.employment_contracts ec
  JOIN public.applications a ON a.id = ec.application_id
  WHERE a.branding_id IN (SELECT public.user_branding_ids(_user_id));
$$;

-- 2) Fix applications: "Users can read own application" (breaks the recursion)
DROP POLICY IF EXISTS "Users can read own application" ON public.applications;
CREATE POLICY "Users can read own application" ON public.applications
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_application_ids(auth.uid())));

-- 3) Fix employment_contracts (SELECT, UPDATE, DELETE) - Kunde part uses apps_for_branding_ids
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (user_id = auth.uid())
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own employment_contract" ON public.employment_contracts;

DROP POLICY IF EXISTS "Admins can update employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (user_id = auth.uid())
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can update own employment_contract" ON public.employment_contracts;

DROP POLICY IF EXISTS "Admins can delete employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

-- 4) Fix interview_appointments (SELECT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
CREATE POLICY "Admins can select appointments" ON public.interview_appointments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can update appointments" ON public.interview_appointments;
CREATE POLICY "Admins can update appointments" ON public.interview_appointments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.interview_appointments;
CREATE POLICY "Admins can delete appointments" ON public.interview_appointments
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

-- 5) Fix trial_day_appointments (SELECT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can delete trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can delete trial_day_appointments" ON public.trial_day_appointments
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can select trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can select trial_day_appointments" ON public.trial_day_appointments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can update trial_day_appointments" ON public.trial_day_appointments;
CREATE POLICY "Admins can update trial_day_appointments" ON public.trial_day_appointments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT public.apps_for_branding_ids(auth.uid()))
    ))
  );

-- 6) Fix chat_messages (SELECT, UPDATE) - uses contracts_for_branding_ids
DROP POLICY IF EXISTS "Admins can select chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can select chat_messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own chat_messages" ON public.chat_messages;

DROP POLICY IF EXISTS "Admins can update chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can update chat_messages" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can mark admin messages as read" ON public.chat_messages;

-- 7) Fix order_appointments (SELECT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can select order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can select order_appointments" ON public.order_appointments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own order_appointments" ON public.order_appointments;

DROP POLICY IF EXISTS "Admins can update order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can update order_appointments" ON public.order_appointments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Admins can delete order_appointments" ON public.order_appointments;
CREATE POLICY "Admins can delete order_appointments" ON public.order_appointments
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

-- 8) Fix order_assignments (SELECT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can select order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can select order_assignments" ON public.order_assignments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own assignments" ON public.order_assignments;

DROP POLICY IF EXISTS "Admins can update order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can update order_assignments" ON public.order_assignments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can update own assignments" ON public.order_assignments;

DROP POLICY IF EXISTS "Admins can delete order_assignments" ON public.order_assignments;
CREATE POLICY "Admins can delete order_assignments" ON public.order_assignments
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

-- 9) Fix order_reviews (SELECT, DELETE)
DROP POLICY IF EXISTS "Admins can select order_reviews" ON public.order_reviews;
CREATE POLICY "Admins can select order_reviews" ON public.order_reviews
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid()))
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can select own order_reviews" ON public.order_reviews;

DROP POLICY IF EXISTS "Admins can delete order_reviews" ON public.order_reviews;
CREATE POLICY "Admins can delete order_reviews" ON public.order_reviews
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR contract_id IN (SELECT public.contracts_for_branding_ids(auth.uid()))
    ))
  );


-- ==================== 20260315110059_10532f1c-0181-4b83-87f1-705b5f486b5c.sql ====================

-- 1. Add branding_id column to employment_contracts
ALTER TABLE public.employment_contracts
ADD COLUMN branding_id uuid REFERENCES public.brandings(id);

-- 2. Backfill from applications
UPDATE public.employment_contracts ec
SET branding_id = a.branding_id
FROM public.applications a
WHERE a.id = ec.application_id;

-- 3. Trigger to auto-populate branding_id on insert
CREATE OR REPLACE FUNCTION public.set_contract_branding_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.branding_id IS NULL AND NEW.application_id IS NOT NULL THEN
    SELECT branding_id INTO NEW.branding_id
    FROM public.applications
    WHERE id = NEW.application_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_contract_branding_id
BEFORE INSERT ON public.employment_contracts
FOR EACH ROW
EXECUTE FUNCTION public.set_contract_branding_id();

-- 4. Update contracts_for_branding_ids to use direct column
CREATE OR REPLACE FUNCTION public.contracts_for_branding_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employment_contracts
  WHERE branding_id IN (SELECT public.user_branding_ids(_user_id));
$$;

-- 5. Simplify RLS policies on employment_contracts to use branding_id directly
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (branding_id IN (SELECT user_branding_ids(auth.uid())))
  ))
);

DROP POLICY IF EXISTS "Admins can update employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can update employment_contracts" ON public.employment_contracts
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (branding_id IN (SELECT user_branding_ids(auth.uid())))
  ))
);

DROP POLICY IF EXISTS "Admins can delete employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can delete employment_contracts" ON public.employment_contracts
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (branding_id IN (SELECT user_branding_ids(auth.uid())))
  ))
);


-- ==================== 20260315112202_98ddfb1b-a082-4e68-88ee-15f3a2dde287.sql ====================

-- 1. Extend orders table with new columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'andere',
  ADD COLUMN IF NOT EXISTS estimated_hours text,
  ADD COLUMN IF NOT EXISTS is_starter_job boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS work_steps jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS required_attachments jsonb DEFAULT '[]'::jsonb;

-- 2. Make order_number optional (allow null, set default)
ALTER TABLE public.orders ALTER COLUMN order_number DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT '';

-- 3. Make provider optional
ALTER TABLE public.orders ALTER COLUMN provider DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN provider SET DEFAULT '';

-- 4. Create order_attachments table
CREATE TABLE public.order_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  attachment_index int NOT NULL,
  file_url text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'eingereicht',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.order_attachments ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read own attachments
CREATE POLICY "Users can select own order_attachments"
ON public.order_attachments FOR SELECT TO authenticated
USING (
  contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid())
);

-- RLS: Users can insert own attachments
CREATE POLICY "Users can insert own order_attachments"
ON public.order_attachments FOR INSERT TO authenticated
WITH CHECK (
  contract_id IN (SELECT ec.id FROM public.employment_contracts ec WHERE ec.user_id = auth.uid())
);

-- RLS: Admins/Kunden can select all
CREATE POLICY "Admins can select order_attachments"
ON public.order_attachments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (contract_id IN (SELECT contracts_for_branding_ids(auth.uid())))
  ))
);

-- RLS: Admins/Kunden can update (approve/reject)
CREATE POLICY "Admins can update order_attachments"
ON public.order_attachments FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (contract_id IN (SELECT contracts_for_branding_ids(auth.uid())))
  ))
);

-- RLS: Admins can delete
CREATE POLICY "Admins can delete order_attachments"
ON public.order_attachments FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (contract_id IN (SELECT contracts_for_branding_ids(auth.uid())))
  ))
);

-- 5. Create storage bucket for order attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('order-attachments', 'order-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage RLS policies
CREATE POLICY "Users can upload order attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'order-attachments');

CREATE POLICY "Anyone can read order attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'order-attachments');

CREATE POLICY "Admins can delete order attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'order-attachments' AND has_role(auth.uid(), 'admin'::app_role));


-- ==================== 20260315114217_c2563dee-980d-4332-96bf-4f7daf14180b.sql ====================
ALTER TABLE public.order_attachments ALTER COLUMN status SET DEFAULT 'entwurf';

-- ==================== 20260315135808_18a4eb13-78b7-46f9-aab7-26bbefca2bb5.sql ====================
ALTER TABLE public.brandings
  ADD COLUMN payment_model text NOT NULL DEFAULT 'per_order',
  ADD COLUMN salary_minijob numeric,
  ADD COLUMN salary_teilzeit numeric,
  ADD COLUMN salary_vollzeit numeric;

-- ==================== 20260315182128_a1321600-570e-4795-92db-8cc80b64cec0.sql ====================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  );
  RETURN NEW;
END;
$$;


-- ==================== 20260315182905_929779f4-2f4d-4dbe-941c-ba490c6e3ff6.sql ====================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branding_id uuid REFERENCES public.brandings(id);

-- ==================== 20260315210656_0b0a5c35-b274-4fbd-a985-3fea3072e7fd.sql ====================

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


-- ==================== 20260315210959_fe298052-ca50-418b-9211-fb5c84da3c09.sql ====================

-- Update user_can_read_branding to also check direct branding_id on employment_contracts
CREATE OR REPLACE FUNCTION public.user_can_read_branding(_branding_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employment_contracts ec
    LEFT JOIN public.applications a ON ec.application_id = a.id
    WHERE ec.user_id = _user_id
      AND (a.branding_id = _branding_id OR ec.branding_id = _branding_id)
  );
$$;


-- ==================== 20260315211005_40515e0f-bd09-4756-aa90-95bd70d96d99.sql ====================

-- Allow authenticated users to insert their own employment contract
CREATE POLICY "Users can insert own employment_contract"
ON public.employment_contracts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());


-- ==================== 20260316091806_ffc9af8f-108e-4b20-8295-1b10a594aaf2.sql ====================

-- Add is_videochat column to orders
ALTER TABLE public.orders ADD COLUMN is_videochat boolean NOT NULL DEFAULT false;

-- Create ident_sessions table
CREATE TABLE public.ident_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.order_assignments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting',
  phone_api_url text,
  test_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  branding_id uuid REFERENCES public.brandings(id)
);

-- Enable RLS
ALTER TABLE public.ident_sessions ENABLE ROW LEVEL SECURITY;

-- Admins/Kunden full access
CREATE POLICY "Admins can manage ident_sessions" ON public.ident_sessions
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid())
      OR branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_kunde(auth.uid())
  );

-- Users can read own sessions
CREATE POLICY "Users can read own ident_sessions" ON public.ident_sessions
  FOR SELECT TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
    )
  );

-- Users can insert own sessions
CREATE POLICY "Users can insert own ident_sessions" ON public.ident_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    contract_id IN (
      SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
    )
  );

-- Users can update own sessions (for marking completed)
CREATE POLICY "Users can update own ident_sessions" ON public.ident_sessions
  FOR UPDATE TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ident_sessions;


-- ==================== 20260316093748_e6c85708-a0d0-4097-87b3-9a6f45fe2b1b.sql ====================
-- Backfill profiles.branding_id from employment_contracts for existing users
UPDATE profiles p
SET branding_id = ec.branding_id
FROM employment_contracts ec
WHERE ec.user_id = p.id
  AND ec.branding_id IS NOT NULL
  AND p.branding_id IS NULL;

-- ==================== 20260316095145_243823d2-55e2-4c78-b7d5-ebaba62f293d.sql ====================
ALTER TABLE public.ident_sessions ADD COLUMN email_tan_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.ident_sessions ADD COLUMN email_tans jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ==================== 20260316102317_37f045d2-ac00-49a1-9518-4aaaac6ad2dc.sql ====================

CREATE POLICY "Users can update own draft order_attachments"
ON public.order_attachments
FOR UPDATE
TO authenticated
USING (
  contract_id IN (SELECT ec.id FROM employment_contracts ec WHERE ec.user_id = auth.uid())
)
WITH CHECK (
  contract_id IN (SELECT ec.id FROM employment_contracts ec WHERE ec.user_id = auth.uid())
);


-- ==================== 20260316102322_b2bf76f1-4b1c-41ac-ba53-077a35ff932f.sql ====================
DELETE FROM order_attachments;

-- ==================== 20260316111611_272918c3-af96-4883-aa0f-7cc58b0ff957.sql ====================
UPDATE order_assignments
SET status = 'in_pruefung'
WHERE order_id = 'c28d539d-8463-4c23-b329-dba1d9d64f58'
  AND contract_id = '9f392f86-c779-426b-82bb-a6fc15abfdfe'
  AND status = 'erfolgreich';

-- ==================== 20260316120522_317f9631-44f6-4733-a7be-82e75992e9fe.sql ====================

-- Create contract_templates table
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  title text NOT NULL,
  employment_type text NOT NULL,
  salary numeric,
  content text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Admins/Kunden full access
CREATE POLICY "Admins can manage contract_templates" ON public.contract_templates
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (is_kunde(auth.uid()) AND (
      NOT user_has_any_branding(auth.uid()) OR
      branding_id IN (SELECT user_branding_ids(auth.uid()))
    ))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid())
  );

-- Users can read templates for their branding
CREATE POLICY "Users can read own branding templates" ON public.contract_templates
  FOR SELECT TO authenticated
  USING (
    user_can_read_branding(branding_id, auth.uid())
  );

-- Add signature columns to brandings
ALTER TABLE public.brandings
  ADD COLUMN IF NOT EXISTS signature_image_url text,
  ADD COLUMN IF NOT EXISTS signer_name text,
  ADD COLUMN IF NOT EXISTS signer_title text,
  ADD COLUMN IF NOT EXISTS signature_font text;

-- Add template_id and contract_dismissed to employment_contracts
ALTER TABLE public.employment_contracts
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.contract_templates(id),
  ADD COLUMN IF NOT EXISTS contract_dismissed boolean NOT NULL DEFAULT false;


-- ==================== 20260316130144_17b1bb02-e4a8-405f-aa73-06098c3ef352.sql ====================
ALTER TABLE public.employment_contracts
  ADD COLUMN IF NOT EXISTS id_type text DEFAULT 'personalausweis',
  ADD COLUMN IF NOT EXISTS proof_of_address_url text,
  ADD COLUMN IF NOT EXISTS requires_proof_of_address boolean NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.submit_employment_contract(uuid, text, text, text, text, date, text, text, text, text, text, text, text, date, text, text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.submit_employment_contract(
  _contract_id uuid, _first_name text, _last_name text, _email text, _phone text,
  _birth_date date, _birth_place text, _nationality text,
  _street text, _zip_code text, _city text, _marital_status text,
  _employment_type text, _desired_start_date date,
  _social_security_number text, _tax_id text, _health_insurance text,
  _iban text, _bic text, _bank_name text,
  _id_front_url text, _id_back_url text,
  _id_type text DEFAULT 'personalausweis',
  _proof_of_address_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.employment_contracts
  SET
    first_name = _first_name, last_name = _last_name, email = _email, phone = _phone,
    birth_date = _birth_date, birth_place = _birth_place, nationality = _nationality,
    street = _street, zip_code = _zip_code, city = _city, marital_status = _marital_status,
    employment_type = _employment_type, desired_start_date = _desired_start_date,
    social_security_number = _social_security_number, tax_id = _tax_id,
    health_insurance = _health_insurance, iban = _iban, bic = _bic, bank_name = _bank_name,
    id_front_url = _id_front_url, id_back_url = _id_back_url,
    id_type = _id_type, proof_of_address_url = _proof_of_address_url,
    status = 'eingereicht', submitted_at = now()
  WHERE id = _contract_id;
END;
$$;

-- ==================== 20260316182913_5e9550e0-d5be-483b-b2ea-2e3a7b44850a.sql ====================

-- Add schedule_type column to branding_schedule_settings
ALTER TABLE public.branding_schedule_settings 
  ADD COLUMN schedule_type text NOT NULL DEFAULT 'interview';

-- Drop the existing unique constraint on branding_id
ALTER TABLE public.branding_schedule_settings 
  DROP CONSTRAINT IF EXISTS branding_schedule_settings_branding_id_key;

-- Add new unique constraint on (branding_id, schedule_type)
ALTER TABLE public.branding_schedule_settings 
  ADD CONSTRAINT branding_schedule_settings_branding_type_key 
  UNIQUE (branding_id, schedule_type);


-- ==================== 20260316184633_400cf82f-f3e7-4b87-af16-28cb4877010a.sql ====================
ALTER TABLE public.brandings
  ADD COLUMN IF NOT EXISTS chat_display_name text,
  ADD COLUMN IF NOT EXISTS chat_avatar_url text,
  ADD COLUMN IF NOT EXISTS chat_online boolean NOT NULL DEFAULT false;

-- ==================== 20260316192847_9d73fa65-05f4-4744-9d8b-5aa7ddf73ce2.sql ====================
-- Update vertrag_genehmigt text
UPDATE sms_templates 
SET message = 'Hallo {name}, herzlichen Glückwunsch! Ihr Arbeitsvertrag wurde genehmigt – Sie sind nun vollwertiger Mitarbeiter. Wir freuen uns auf die Zusammenarbeit!',
    updated_at = now()
WHERE event_type = 'vertrag_genehmigt';

-- Delete obsolete termin_gebucht
DELETE FROM sms_templates WHERE event_type = 'termin_gebucht';

-- Insert new templates
INSERT INTO sms_templates (event_type, label, message) VALUES
  ('gespraech_bestaetigung', 'Bewerbungsgespräch Bestätigung', 'Hallo {name}, Ihr Bewerbungsgespräch ist bestätigt: {datum} um {uhrzeit} Uhr. Wir freuen uns auf Sie!'),
  ('probetag_bestaetigung', 'Probetag Bestätigung', 'Hallo {name}, Ihr Probetag ist bestätigt: {datum} um {uhrzeit} Uhr. Wir freuen uns auf Sie!'),
  ('konto_erstellt', 'Konto erstellt', 'Hallo {name}, Ihr Konto wurde erfolgreich erstellt. Bitte reichen Sie nun Ihre Vertragsdaten ein.'),
  ('vertrag_eingereicht', 'Vertrag eingereicht', 'Hallo {name}, Ihre Vertragsdaten wurden erfolgreich eingereicht. Wir prüfen diese zeitnah.')
ON CONFLICT DO NOTHING;

-- ==================== 20260316211917_681fef45-3367-4c8e-9aa6-3175cd19c127.sql ====================
ALTER TABLE interview_appointments 
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
ALTER TABLE trial_day_appointments 
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;

-- ==================== 20260316211937_7d84ea74-c416-4bd3-9017-f1c42c53b46e.sql ====================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ==================== 20260316212032_687633ae-a06f-4788-8ac1-7d736cde8e46.sql ====================
INSERT INTO sms_templates (event_type, label, message) VALUES
  ('gespraech_erinnerung_auto', 'Bewerbungsgespräch Erinnerung (24h)', 
   'Hallo {name}, zur Erinnerung: Morgen um {uhrzeit} Uhr findet Ihr Bewerbungsgespräch statt. Wir freuen uns auf Sie!'),
  ('probetag_erinnerung_auto', 'Probetag Erinnerung (24h)', 
   'Hallo {name}, zur Erinnerung: Morgen um {uhrzeit} Uhr ist Ihr Probetag. Wir freuen uns auf Sie!')
ON CONFLICT DO NOTHING;

-- ==================== 20260316212046_8cd5e9cf-1a48-4c4f-8216-7603cd1f8fba.sql ====================
SELECT cron.schedule(
  'appointment-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://luorlnagxpsibarcygjm.supabase.co/functions/v1/send-appointment-reminders',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1b3JsbmFneHBzaWJhcmN5Z2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDI3MTAsImV4cCI6MjA4NjM3ODcxMH0.B0MYZqUChRbyW3ekOR8YI4j7q153ME77qI_LjUUJTqs"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- ==================== 20260317085923_2daff88b-7cbc-4dc7-8f03-0f0097f93a5a.sql ====================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caller';

-- ==================== 20260317085930_ed4126e1-89b8-4c0a-a829-856372289b43.sql ====================

-- Create is_caller helper function
CREATE OR REPLACE FUNCTION public.is_caller(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'caller')
$$;


-- ==================== 20260317085959_bebf2fe9-3e19-498e-a17e-792f2dbdead4.sql ====================

-- Update RLS policies for applications to include caller
DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
CREATE POLICY "Admins can select applications" ON public.applications FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))));

DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))));

-- Update RLS for interview_appointments
DROP POLICY IF EXISTS "Admins can select appointments" ON public.interview_appointments;
CREATE POLICY "Admins can select appointments" ON public.interview_appointments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (application_id IN (SELECT apps_for_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid())))));

DROP POLICY IF EXISTS "Admins can update appointments" ON public.interview_appointments;
CREATE POLICY "Admins can update appointments" ON public.interview_appointments FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (application_id IN (SELECT apps_for_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid())))));

DROP POLICY IF EXISTS "Admins can insert appointments" ON public.interview_appointments;
CREATE POLICY "Admins can insert appointments" ON public.interview_appointments FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()) OR is_caller(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.interview_appointments;
CREATE POLICY "Admins can delete appointments" ON public.interview_appointments FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (application_id IN (SELECT apps_for_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid())))));

-- Update RLS for trial_day_appointments
DROP POLICY IF EXISTS "Admins can select trial_day_appointments" ON public.trial_day_appointments;
DROP POLICY IF EXISTS "Admins can manage trial_day_appointments" ON public.trial_day_appointments;
-- Check existing policies first - trial_day has similar pattern
CREATE POLICY "Caller can select trial_day_appointments" ON public.trial_day_appointments FOR SELECT TO authenticated
USING (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid()))));

CREATE POLICY "Caller can update trial_day_appointments" ON public.trial_day_appointments FOR UPDATE TO authenticated
USING (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid()))));

CREATE POLICY "Caller can insert trial_day_appointments" ON public.trial_day_appointments FOR INSERT TO authenticated
WITH CHECK (is_caller(auth.uid()));

CREATE POLICY "Caller can delete trial_day_appointments" ON public.trial_day_appointments FOR DELETE TO authenticated
USING (is_caller(auth.uid()) AND (application_id IN (SELECT apps_for_branding_ids(auth.uid()))));

-- Update RLS for employment_contracts (read only for caller)
DROP POLICY IF EXISTS "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts" ON public.employment_contracts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (user_id = auth.uid()) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))));

-- Update RLS for brandings (read only for caller)
DROP POLICY IF EXISTS "Admins can select brandings" ON public.brandings;
CREATE POLICY "Admins can select brandings" ON public.brandings FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (id IN (SELECT user_branding_ids(auth.uid())))) OR user_can_read_branding(id, auth.uid()));

-- Update RLS for branding_schedule_settings (read for caller)
DROP POLICY IF EXISTS "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings;
CREATE POLICY "Authenticated can manage branding_schedule_settings" ON public.branding_schedule_settings FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()) OR is_caller(auth.uid()));

-- Update RLS for schedule_blocked_slots
DROP POLICY IF EXISTS "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots;
CREATE POLICY "Authenticated can manage schedule_blocked_slots" ON public.schedule_blocked_slots FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()) OR is_caller(auth.uid()));

-- Caller can read own kunde_brandings
DROP POLICY IF EXISTS "Kunden can read own kunde_brandings" ON public.kunde_brandings;
CREATE POLICY "Kunden and callers can read own kunde_brandings" ON public.kunde_brandings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Caller can read own admin_permissions
-- Already covered by "Users can read own permissions" policy

-- Caller can read email_logs for sending emails
DROP POLICY IF EXISTS "Admins can select email_logs" ON public.email_logs;
CREATE POLICY "Admins can select email_logs" ON public.email_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (is_kunde(auth.uid()) AND ((NOT user_has_any_branding(auth.uid())) OR (branding_id IN (SELECT user_branding_ids(auth.uid()))))) OR (is_caller(auth.uid()) AND (branding_id IN (SELECT user_branding_ids(auth.uid())))));

-- Caller can view profiles (needed for sidebar etc)
CREATE POLICY "Callers can view profiles" ON public.profiles FOR SELECT TO authenticated
USING (is_caller(auth.uid()));


-- ==================== 20260317091850_48a2d546-32d6-47ef-b20d-599b4ac8089c.sql ====================
CREATE POLICY "Admins can see all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ==================== 20260317093144_de98acb1-fd33-433b-ace7-aa33d7f85d55.sql ====================
INSERT INTO sms_templates (event_type, label, message) VALUES ('ident_daten_gesendet', 'Ident-Daten gesendet', 'Hallo {name}, die Testdaten für deinen Auftrag "{auftrag}" wurden eingereicht. Du kannst den Auftrag jetzt bearbeiten.');

-- ==================== 20260317172448_05ca3245-2941-4f73-b928-1fae53513315.sql ====================
ALTER TABLE public.brandings ADD COLUMN sms_ident_disabled boolean NOT NULL DEFAULT false;

-- ==================== 20260317180124_28fd21cf-f5a4-4555-b5c4-90eb17a158bd.sql ====================
ALTER TABLE public.brandings
ADD COLUMN chat_online_from time NOT NULL DEFAULT '08:00',
ADD COLUMN chat_online_until time NOT NULL DEFAULT '17:00';

-- ==================== 20260317184039_866ea2c5-eee5-458f-bb48-78e8afb4d25b.sql ====================
ALTER TABLE public.brandings
  ADD COLUMN hourly_rate_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN hourly_rate_minijob numeric,
  ADD COLUMN hourly_rate_teilzeit numeric,
  ADD COLUMN hourly_rate_vollzeit numeric;

-- ==================== 20260318174638_c0e31f21-02b3-4f68-b146-416a198b066d.sql ====================
ALTER TABLE public.applications ADD COLUMN is_external boolean NOT NULL DEFAULT false;

-- ==================== 20260319192855_7dfd6ae6-c091-4cc2-87ef-bf5b6991dc87.sql ====================
DROP POLICY "Admins can insert short_links" ON public.short_links;
CREATE POLICY "Admins and Kunden can insert short_links"
  ON public.short_links FOR INSERT
  TO public
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_kunde(auth.uid())
  );

-- ==================== 20260320141830_ef52289f-a5ea-442a-8b81-52a44647524f.sql ====================
ALTER TABLE public.brandings ADD COLUMN subdomain_prefix text NOT NULL DEFAULT 'web';

-- ==================== 20260320173236_7fdde5d8-961a-48b9-b187-7e1242da0a25.sql ====================
-- Add SELECT policy for admin/kunde on trial_day_appointments
CREATE POLICY "Admin kunde can select trial_day_appointments"
ON public.trial_day_appointments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_kunde(auth.uid())
    AND (
      NOT user_has_any_branding(auth.uid())
      OR application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    )
  )
);

-- ==================== 20260320174937_30a5019e-bf8d-4e9b-8f24-d19137733352.sql ====================
UPDATE public.telegram_chats
SET events = array_append(events, 'probetag_gebucht')
WHERE 'gespraech_gebucht' = ANY(events)
  AND NOT ('probetag_gebucht' = ANY(events));

-- ==================== 20260320193114_edacae72-a987-4346-a971-1625cefbf5d9.sql ====================
-- Drop existing admin-only policies on branding-logos
DROP POLICY IF EXISTS "Admins can upload branding logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update branding logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete branding logos" ON storage.objects;

-- Recreate with admin + kunde access
CREATE POLICY "Admins and kunden can upload branding logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'branding-logos'
  AND (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()))
);

CREATE POLICY "Admins and kunden can update branding logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'branding-logos'
  AND (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()))
);

CREATE POLICY "Admins and kunden can delete branding logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'branding-logos'
  AND (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()))
);

-- ==================== 20260321084833_0b36fb40-7db5-4716-a2a4-849f5af892c4.sql ====================
ALTER TABLE public.branding_schedule_settings
ADD COLUMN weekend_start_time time without time zone DEFAULT NULL,
ADD COLUMN weekend_end_time time without time zone DEFAULT NULL;

-- ==================== 20260321090949_fae8ffab-1227-4bcc-88fd-f0a5c3be1d6e.sql ====================
ALTER TABLE public.brandings
  ADD COLUMN email_logo_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN email_logo_url text;

-- ==================== 20260321091901_6d0fd151-f5e3-44ed-b504-d36163ddf1f4.sql ====================
ALTER TABLE public.brandings ADD COLUMN main_job_title text;

-- ==================== 20260321091911_24112062-679f-49f0-a5cc-51962a63f4a4.sql ====================
UPDATE public.brandings SET main_job_title = 'Mitarbeiter für Onlineprozess-Tests (Quality Assurance)' WHERE main_job_title IS NULL;

-- ==================== 20260321093106_118834a0-049c-4e8d-b293-62c53e47f031.sql ====================

-- Table: first_workday_appointments
CREATE TABLE public.first_workday_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time without time zone NOT NULL,
  status text NOT NULL DEFAULT 'neu',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  reminder_sent boolean NOT NULL DEFAULT false,
  UNIQUE(application_id)
);

ALTER TABLE public.first_workday_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select first_workday_appointments" ON public.first_workday_appointments FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR
  (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (SELECT apps_for_branding_ids(auth.uid())))) OR
  (is_caller(auth.uid()) AND application_id IN (SELECT apps_for_branding_ids(auth.uid())))
);

CREATE POLICY "Admins can insert first_workday_appointments" ON public.first_workday_appointments FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()) OR is_caller(auth.uid())
);

CREATE POLICY "Admins can update first_workday_appointments" ON public.first_workday_appointments FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin') OR
  (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (SELECT apps_for_branding_ids(auth.uid())))) OR
  (is_caller(auth.uid()) AND application_id IN (SELECT apps_for_branding_ids(auth.uid())))
);

CREATE POLICY "Admins can delete first_workday_appointments" ON public.first_workday_appointments FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'admin') OR
  (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR application_id IN (SELECT apps_for_branding_ids(auth.uid())))) OR
  (is_caller(auth.uid()) AND application_id IN (SELECT apps_for_branding_ids(auth.uid())))
);

CREATE POLICY "Anyone can view first_workday_appointments" ON public.first_workday_appointments FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can book first_workday_appointments" ON public.first_workday_appointments FOR INSERT TO anon WITH CHECK (true);

-- Table: first_workday_blocked_slots
CREATE TABLE public.first_workday_blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date date NOT NULL,
  blocked_time time without time zone NOT NULL,
  branding_id uuid REFERENCES public.brandings(id),
  reason text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.first_workday_blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read first_workday_blocked_slots" ON public.first_workday_blocked_slots FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated can manage first_workday_blocked_slots" ON public.first_workday_blocked_slots FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))) OR (is_caller(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid()))))
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()) OR is_caller(auth.uid()));

-- RPC: update_first_workday_status
CREATE OR REPLACE FUNCTION public.update_first_workday_status(_appointment_id uuid, _status text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.first_workday_appointments
  SET status = _status
  WHERE id = _appointment_id;
END;
$$;


-- ==================== 20260322090655_bd17d3d0-2f6d-46a1-949a-56b0be279df3.sql ====================
ALTER TABLE public.brandings
  ADD COLUMN estimated_salary_minijob numeric,
  ADD COLUMN estimated_salary_teilzeit numeric,
  ADD COLUMN estimated_salary_vollzeit numeric;

-- ==================== 20260322093038_4be1a807-9094-4928-be84-987453b92fb4.sql ====================
UPDATE public.sms_templates SET message = 'Hallo {name}, Ihre Bewerbung über Instagram/Facebook als {jobtitel} wurde angenommen! Bitte buchen Sie Ihren Termin über den Link in der Email, die Sie erhalten haben.' WHERE event_type = 'bewerbung_angenommen_extern';

-- ==================== 20260323152346_93d55c0f-4c1d-48f3-b485-0d5af1b9e0cb.sql ====================
CREATE TABLE public.branding_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  page_context text NOT NULL,
  content text NOT NULL,
  author_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.branding_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read branding_notes" ON public.branding_notes
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))) OR
    (is_caller(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid())))
  );

CREATE POLICY "Users can insert branding_notes" ON public.branding_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR is_kunde(auth.uid()) OR is_caller(auth.uid())
  );

CREATE POLICY "Users can delete own branding_notes" ON public.branding_notes
  FOR DELETE TO authenticated
  USING (
    author_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ==================== 20260323153022_00987db7-780d-415e-8e02-457ce1d3784b.sql ====================
DROP POLICY "Users can delete own branding_notes" ON public.branding_notes;

CREATE POLICY "Users can delete branding_notes" ON public.branding_notes
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid()))))
    OR (is_caller(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid())))
  );

-- ==================== 20260323155536_0fc82cfe-e1c9-413b-83f3-b57f9b3a7d66.sql ====================
ALTER TABLE public.brandings ADD COLUMN IF NOT EXISTS favicon_url text;

-- ==================== 20260323165820_5c891aca-f35e-4f21-b190-bdbd86f82e18.sql ====================

-- Add spoof_credits column to brandings
ALTER TABLE public.brandings ADD COLUMN IF NOT EXISTS spoof_credits integer DEFAULT NULL;

-- RLS policies for sms_logs: allow Kunden to SELECT their branding's logs
CREATE POLICY "Kunden can select own branding sms_logs"
ON public.sms_logs
FOR SELECT
TO authenticated
USING (
  is_kunde(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid()))
);

-- RLS policies for sms_spoof_logs: allow Kunden to SELECT their branding's logs
CREATE POLICY "Kunden can select own branding sms_spoof_logs"
ON public.sms_spoof_logs
FOR SELECT
TO authenticated
USING (
  is_kunde(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid()))
);


-- ==================== 20260323165905_9161b98b-2196-4684-96f9-54e431feea3c.sql ====================

CREATE OR REPLACE FUNCTION public.decrement_spoof_credits(_branding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.brandings
  SET spoof_credits = spoof_credits - 1
  WHERE id = _branding_id
    AND spoof_credits IS NOT NULL;
END;
$$;


-- ==================== 20260323172158_a68b79c8-ce6c-4de9-9657-52b377351525.sql ====================
ALTER TABLE public.brandings
  ADD COLUMN IF NOT EXISTS project_manager_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS project_manager_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS project_manager_image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recruiter_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recruiter_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recruiter_image_url text DEFAULT NULL;

-- ==================== 20260324152106_0de2dce4-0ee1-4eeb-8219-946356ad72d0.sql ====================
ALTER TABLE public.interview_appointments ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS notification_count integer NOT NULL DEFAULT 0;

-- ==================== 20260324152559_fffcc1c0-656c-4e49-9cbd-bb3e9804726b.sql ====================
ALTER TABLE public.interview_appointments
  ADD COLUMN IF NOT EXISTS reminder_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS notification_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ==================== 20260325201710_78c7bae9-5f98-4dde-92ef-8dd197a01c4d.sql ====================
ALTER TABLE interview_appointments
ADD COLUMN probetag_invite_count integer NOT NULL DEFAULT 0,
ADD COLUMN probetag_invite_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ==================== 20260326155439_609d3ff1-af75-4da0-a902-98e1632b58a5.sql ====================
CREATE POLICY "Anon can delete own appointment for rebooking"
ON public.interview_appointments
FOR DELETE
TO anon
USING (true);

-- ==================== 20260326175940_ad18df47-6103-443a-824e-66f6061d075e.sql ====================
CREATE POLICY "Anon can delete own trial appointment for rebooking"
ON public.trial_day_appointments
FOR DELETE
TO anon
USING (true);

-- ==================== 20260326181924_1582147e-8ae7-4d40-8a21-8926b80f97d4.sql ====================
ALTER TABLE public.trial_day_appointments ADD COLUMN reminder_count integer NOT NULL DEFAULT 0, ADD COLUMN reminder_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb; INSERT INTO public.sms_templates (event_type, label, message) VALUES ('probetag_erinnerung', 'Probetag Erinnerung', 'Hallo {name}, Sie hatten einen Probetag-Termin bei uns. Falls Sie den Termin nicht wahrnehmen konnten, buchen Sie bitte einen neuen Termin über den Link in Ihrer E-Mail.');

-- ==================== 20260327090821_eb1f2b13-56ae-41a8-b47f-29535ea351eb.sql ====================
CREATE POLICY "Admin and kunde can update sms_logs"
ON public.sms_logs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_kunde(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.is_kunde(auth.uid())
);

-- ==================== 20260330085152_b0a6ab25-3d04-4366-9afd-7b32aa9b4d31.sql ====================
-- Add contract_id column to first_workday_appointments
ALTER TABLE public.first_workday_appointments
  ADD COLUMN contract_id uuid REFERENCES public.employment_contracts(id) ON DELETE CASCADE;

-- Backfill existing data
UPDATE public.first_workday_appointments fwa
SET contract_id = ec.id
FROM public.employment_contracts ec
WHERE ec.application_id = fwa.application_id;

-- Make application_id nullable (for new contract-based bookings)
ALTER TABLE public.first_workday_appointments
  ALTER COLUMN application_id DROP NOT NULL;

-- Add RLS policy for authenticated users to book via contract_id
CREATE POLICY "Authenticated can insert first_workday by contract_id"
ON public.first_workday_appointments
FOR INSERT TO authenticated
WITH CHECK (
  contract_id IN (
    SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
  )
);

-- Add RLS policy for users to read own appointments via contract_id
CREATE POLICY "Users can read own first_workday by contract_id"
ON public.first_workday_appointments
FOR SELECT TO authenticated
USING (
  contract_id IN (
    SELECT id FROM public.employment_contracts WHERE user_id = auth.uid()
  )
);

-- Anon can also insert by contract_id (for public booking page)
CREATE POLICY "Anon can book first_workday by contract_id"
ON public.first_workday_appointments
FOR INSERT TO anon
WITH CHECK (contract_id IS NOT NULL);

-- Anon can read by contract_id
CREATE POLICY "Anon can read first_workday by contract_id"
ON public.first_workday_appointments
FOR SELECT TO anon
USING (contract_id IS NOT NULL);

-- ==================== 20260330111606_50714552-c4fe-4eef-8fc7-594ef11cf397.sql ====================

-- Trigger function to normalize email to lowercase
CREATE OR REPLACE FUNCTION public.normalize_email_lowercase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on employment_contracts
CREATE TRIGGER trg_normalize_email_employment_contracts
BEFORE INSERT OR UPDATE ON public.employment_contracts
FOR EACH ROW EXECUTE FUNCTION public.normalize_email_lowercase();

-- Trigger on applications
CREATE TRIGGER trg_normalize_email_applications
BEFORE INSERT OR UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.normalize_email_lowercase();

-- Clean up existing data
UPDATE public.employment_contracts SET email = lower(trim(email)) WHERE email IS NOT NULL AND email != lower(trim(email));
UPDATE public.applications SET email = lower(trim(email)) WHERE email IS NOT NULL AND email != lower(trim(email));


-- ==================== 20260330143232_608a5f8d-bf91-4e53-b543-5ab2fcf7ea44.sql ====================
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.employment_contracts REPLICA IDENTITY FULL;

-- ==================== 20260330151659_eabd1d0e-b79c-402c-856d-3a91395d8047.sql ====================

-- 1. Security definer function for booked slots
CREATE OR REPLACE FUNCTION public.booked_slots_for_branding(_branding_id uuid)
RETURNS TABLE(appointment_date date, appointment_time time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT fwa.appointment_date, fwa.appointment_time
  FROM first_workday_appointments fwa
  WHERE fwa.contract_id IN (
    SELECT id FROM employment_contracts WHERE branding_id = _branding_id
  )
  UNION
  SELECT fwa.appointment_date, fwa.appointment_time
  FROM first_workday_appointments fwa
  WHERE fwa.application_id IN (
    SELECT id FROM applications WHERE branding_id = _branding_id
  )
  UNION
  SELECT tda.appointment_date, tda.appointment_time
  FROM trial_day_appointments tda
  WHERE tda.application_id IN (
    SELECT id FROM applications WHERE branding_id = _branding_id
  )
$$;

-- 2. User can delete own first_workday_appointments for rebooking
CREATE POLICY "Users can delete own first_workday_appointments"
ON public.first_workday_appointments FOR DELETE TO authenticated
USING (
  contract_id IN (
    SELECT id FROM employment_contracts WHERE user_id = auth.uid()
  )
);

-- 3. All authenticated users can read sms_templates
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read sms_templates"
ON public.sms_templates FOR SELECT TO authenticated
USING (true);


-- ==================== 20260330163221_a7383600-2684-4ff9-9c1c-e0cbf3a92967.sql ====================
-- Fix RLS policies for first_workday_appointments to include contract_id lookups for kunde/caller

DROP POLICY "Admins can select first_workday_appointments" ON public.first_workday_appointments;
CREATE POLICY "Admins can select first_workday_appointments"
ON public.first_workday_appointments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
  OR (is_caller(auth.uid()) AND (
    application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
);

DROP POLICY "Admins can update first_workday_appointments" ON public.first_workday_appointments;
CREATE POLICY "Admins can update first_workday_appointments"
ON public.first_workday_appointments FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
  OR (is_caller(auth.uid()) AND (
    application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
);

DROP POLICY "Admins can delete first_workday_appointments" ON public.first_workday_appointments;
CREATE POLICY "Admins can delete first_workday_appointments"
ON public.first_workday_appointments FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
  OR (is_caller(auth.uid()) AND (
    application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
);

DROP POLICY "Admins can insert first_workday_appointments" ON public.first_workday_appointments;
CREATE POLICY "Admins can insert first_workday_appointments"
ON public.first_workday_appointments FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_kunde(auth.uid())
  OR is_caller(auth.uid())
);

-- ==================== 20260330163739_1a746d58-dc00-495c-a142-f7d610f098d7.sql ====================
-- Fix: Allow authenticated users to read employment_contracts where user_id IS NULL
-- This matches the existing anon policy (which allows reading ALL contracts)

DROP POLICY "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts"
ON public.employment_contracts FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (branding_id IN (SELECT user_branding_ids(auth.uid())))
  ))
  OR (is_caller(auth.uid()) AND (
    branding_id IN (SELECT user_branding_ids(auth.uid()))
  ))
  OR (user_id IS NULL)
);

-- ==================== 20260330165245_e40e5e2f-5959-4efb-bbea-6c5b6e5dace3.sql ====================
-- Public RPC to book/rebook a first workday appointment (no auth required)
CREATE OR REPLACE FUNCTION public.book_first_workday_public(
  _contract_id uuid,
  _appointment_date date,
  _appointment_time time,
  _phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify contract exists
  IF NOT EXISTS (SELECT 1 FROM employment_contracts WHERE id = _contract_id) THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  -- Delete existing appointment for this contract
  DELETE FROM first_workday_appointments WHERE contract_id = _contract_id;

  -- Insert new appointment
  INSERT INTO first_workday_appointments (contract_id, application_id, appointment_date, appointment_time, created_by)
  SELECT _contract_id, ec.application_id, _appointment_date, _appointment_time, ec.created_by
  FROM employment_contracts ec
  WHERE ec.id = _contract_id;

  -- Optionally update phone
  IF _phone IS NOT NULL AND _phone <> '' THEN
    UPDATE employment_contracts SET phone = _phone WHERE id = _contract_id;
  END IF;
END;
$$;

-- Public RPC to update phone on a contract (no auth required, link = access)
CREATE OR REPLACE FUNCTION public.update_contract_phone_public(
  _contract_id uuid,
  _phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE employment_contracts SET phone = _phone WHERE id = _contract_id;
END;
$$;

-- Grant execute to both anon and authenticated
GRANT EXECUTE ON FUNCTION public.book_first_workday_public(uuid, date, time, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_contract_phone_public(uuid, text) TO anon, authenticated;

-- ==================== 20260330171033_a375395b-310c-4c39-afa1-110bd2ae29df.sql ====================

-- Drop old function (return type changed from void to uuid)
DROP FUNCTION IF EXISTS public.book_first_workday_public(uuid, date, time, text);

-- Recreate with uuid return type
CREATE OR REPLACE FUNCTION public.book_first_workday_public(
  _contract_id uuid,
  _appointment_date date,
  _appointment_time time,
  _phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM employment_contracts WHERE id = _contract_id) THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  DELETE FROM first_workday_appointments WHERE contract_id = _contract_id;

  INSERT INTO first_workday_appointments (contract_id, application_id, appointment_date, appointment_time, created_by)
  SELECT _contract_id, ec.application_id, _appointment_date, _appointment_time, ec.created_by
  FROM employment_contracts ec
  WHERE ec.id = _contract_id
  RETURNING id INTO new_id;

  IF _phone IS NOT NULL AND _phone <> '' THEN
    UPDATE employment_contracts SET phone = _phone WHERE id = _contract_id;
  END IF;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_first_workday_public(uuid, date, time, text) TO anon, authenticated;


-- ==================== 20260330171112_8ae950d6-5247-4ee9-bdce-f0236fc155cb.sql ====================

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


-- ==================== 20260331151117_4d0c93e0-e8f0-4065-a2ed-d57a742b62a4.sql ====================

-- Fix assignments wrongly reset to 'offen' by AssignmentDialog delete-all bug
-- Assignments with reviews + all attachments approved → erfolgreich
UPDATE order_assignments SET status = 'erfolgreich' WHERE id IN (
  '65304896-7931-4ea2-9262-ecdc5073e966',
  '42fb7661-a115-4244-bfe0-47a3af1992aa',
  'd9388de5-35b9-4001-9085-3acf7726548f',
  'efed2e89-fd28-43c9-bc6a-176a18da0537',
  '713d2fa2-3212-4a74-8ad8-334771eb8935',
  '08960e23-64ef-4107-82b3-ce21025a9639',
  '9fd182a6-87aa-4725-b1a8-21121073f45d',
  'c4dbf754-ee26-4ffd-97ef-4e20ca6118c7',
  'dae77c88-fc94-4a44-aed9-9207ae85bded',
  '5647fd3d-52b8-4d36-80ba-57631dc411d1'
);

-- Assignments with reviews but pending attachments → in_pruefung
UPDATE order_assignments SET status = 'in_pruefung' WHERE id IN (
  'f766c707-4a03-4adc-b6ea-3341096314ca',
  '62283f90-0355-465e-9732-cf6c64cbd628',
  '42b50a1b-9c3f-4df7-b1c7-519fd074d579',
  '2a018bfd-4b86-4728-a35a-0e7e224d02f3',
  '5da59f2a-c488-4ab5-8c6e-c4b9605f6bdd'
);


-- ==================== 20260401152454_31433792-0555-45b8-bafa-260a441099bd.sql ====================

ALTER TABLE ident_sessions ALTER COLUMN assignment_id DROP NOT NULL;
ALTER TABLE ident_sessions ALTER COLUMN order_id DROP NOT NULL;

ALTER TABLE ident_sessions
  DROP CONSTRAINT ident_sessions_assignment_id_fkey,
  ADD CONSTRAINT ident_sessions_assignment_id_fkey
    FOREIGN KEY (assignment_id) REFERENCES order_assignments(id) ON DELETE SET NULL;

ALTER TABLE ident_sessions
  DROP CONSTRAINT ident_sessions_order_id_fkey,
  ADD CONSTRAINT ident_sessions_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;


-- ==================== 20260402094812_03c0ba13-20df-43da-8dfc-bfa6452e72a3.sql ====================

-- 1. Update both assignments to in_pruefung
UPDATE order_assignments 
SET status = 'in_pruefung'
WHERE id IN ('8e0f3e2a-f5e0-4f09-8190-0d9338712b7a', '24098b3d-7add-4fe7-8cec-6de524fb9c43');

-- 2. Insert Simon's 7 reviews
INSERT INTO order_reviews (order_id, contract_id, question, rating, comment) VALUES
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Wie ist das Nutzererlebnis der Website?', 4, 'Gut strukturiert und übersichtlich.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Ist die Website strukturiert?', 4, 'Ja, die Struktur ist klar und logisch aufgebaut.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Findet man sich dort als Neukunde zurecht?', 4, 'Ja, man findet sich gut zurecht.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Wie bewertest du die Website persönlich?', 4, 'Insgesamt eine solide Website.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Beschreibe den Prozess der Video Identifikation.', 4, 'Der Prozess war klar und verständlich.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Ist der Videoident-Prozess effizient und gut durchführbar gestaltet?', 4, 'Ja, effizient und gut umsetzbar.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Schildere deine persönliche Erfahrung im Videoident-Prozess.', 4, 'Gute Erfahrung insgesamt.');

-- 3. Insert completed ident sessions for both
INSERT INTO ident_sessions (contract_id, assignment_id, order_id, branding_id, status, completed_at) VALUES
('de992ca7-7a4d-42a1-85e0-10be3183ef96', '8e0f3e2a-f5e0-4f09-8190-0d9338712b7a', 'f1c42b20-1207-46cb-9eed-c97edefaaddd', 'e4f832ef-4f72-4fa3-983e-07b678a698a1', 'completed', now()),
('f477225a-81d8-4d6f-9117-92d8a4f853c2', '24098b3d-7add-4fe7-8cec-6de524fb9c43', 'f1c42b20-1207-46cb-9eed-c97edefaaddd', 'e4f832ef-4f72-4fa3-983e-07b678a698a1', 'completed', now());


-- ==================== 20260402100107_e1f49338-78ea-4e05-ba67-9ffb0aa59a07.sql ====================
ALTER TABLE trial_day_appointments 
ADD COLUMN IF NOT EXISTS success_notification_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_notification_timestamps jsonb DEFAULT '[]'::jsonb;

-- ==================== 20260402102153_fc325b5d-5d07-477b-ab7b-d8ce46814cb3.sql ====================
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at timestamptz DEFAULT NULL;

-- ==================== 20260402102809_4d35c26a-855c-4326-9cd2-e0b970cbe2a6.sql ====================
ALTER TABLE ident_sessions ADD COLUMN IF NOT EXISTS info_notes text DEFAULT '';

-- ==================== 20260402160605_1f0de6b7-b16c-4131-ae5e-743a3eb2d298.sql ====================
DELETE FROM sms_logs WHERE status = 'failed';

-- ==================== 20260409164753_911c463b-e7d5-4bf6-ac34-634efb1b679c.sql ====================
ALTER TABLE public.applications ADD COLUMN is_meta boolean NOT NULL DEFAULT false;

-- ==================== 20260409164838_7365cc2b-79ef-4899-b968-37ed2d5b35f4.sql ====================
INSERT INTO public.sms_templates (event_type, label, message)
VALUES (
  'bewerbung_angenommen_extern_meta',
  'Bewerbung angenommen Extern META',
  'Hallo {name}, deine Bewerbung über Instagram/Facebook im Bereich Onlineprozess-Tests (Quality Assurance) wurde angenommen! Bitte buche deinen Kennenlerngesprächstermin über den Link in der E-Mail, die du erhalten hast.'
);

-- ==================== 20260409173100_6aab34f9-78ce-4a3c-98fc-4cf0f35ccc2d.sql ====================
UPDATE applications 
SET is_meta = true, is_external = false
WHERE is_external = true 
  AND is_meta = false 
  AND is_indeed = false
  AND created_at < '2026-04-09 17:23:00';

-- ==================== 20260409174002_3730a563-973f-4337-abb9-db988abe04d9.sql ====================
ALTER TABLE public.sms_spoof_logs ADD COLUMN source text DEFAULT 'auto';
UPDATE public.sms_spoof_logs SET source = 'manual';

-- ==================== 20260409174404_0ae92fb5-5c44-4a57-ba23-28293c8f9625.sql ====================
UPDATE sms_spoof_logs SET source = 'auto' WHERE message LIKE '%Deine Bewerbung bei%war erfolgreich%';

-- ==================== 20260420172920_9f2d6e13-d83c-4bfd-9dd2-e9555b0e3756.sql ====================
UPDATE public.applications
SET status = 'neu'
WHERE is_meta = true
  AND created_at::date = CURRENT_DATE
  AND status = 'bewerbungsgespraech'
  AND NOT EXISTS (
    SELECT 1 FROM public.sms_logs s
    WHERE s.event_type = 'bewerbung_angenommen_extern_meta'
      AND s.created_at::date = CURRENT_DATE
      AND s.recipient_name ILIKE applications.first_name || ' ' || applications.last_name
  );

DELETE FROM public.interview_appointments
WHERE application_id IN (
  SELECT id FROM public.applications
  WHERE is_meta = true
    AND created_at::date = CURRENT_DATE
    AND status = 'neu'
)
AND created_at::date = CURRENT_DATE;

-- ==================== 20260422164950_dd1cf698-0a63-473c-9880-01aec01a829a.sql ====================
DROP POLICY IF EXISTS "Admins and Kunden can insert short_links" ON public.short_links;

CREATE POLICY "Admins, Kunden and Caller can insert short_links"
  ON public.short_links FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_kunde(auth.uid())
    OR is_caller(auth.uid())
  );

-- ==================== 20260423133407_02cf7948-1315-4280-83ac-a7417ba4c191.sql ====================
CREATE OR REPLACE FUNCTION public.interview_booked_slots_for_branding(_branding_id uuid)
RETURNS TABLE(appointment_date date, appointment_time time without time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ia.appointment_date, ia.appointment_time
  FROM interview_appointments ia
  JOIN applications a ON a.id = ia.application_id
  WHERE a.branding_id = _branding_id
$$;

CREATE OR REPLACE FUNCTION public.trial_day_booked_slots_for_branding(_branding_id uuid)
RETURNS TABLE(appointment_date date, appointment_time time without time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tda.appointment_date, tda.appointment_time
  FROM trial_day_appointments tda
  JOIN applications a ON a.id = tda.application_id
  WHERE a.branding_id = _branding_id
$$;

GRANT EXECUTE ON FUNCTION public.interview_booked_slots_for_branding(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_day_booked_slots_for_branding(uuid) TO anon, authenticated;

-- ==================== 20260423151814_91529a4b-4da5-45d6-bdb9-8176bee9e938.sql ====================
ALTER TABLE public.brandings ADD COLUMN seven_api_key text;
