
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
