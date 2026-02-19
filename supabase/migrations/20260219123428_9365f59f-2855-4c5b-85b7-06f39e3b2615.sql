
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
