ALTER TABLE public.brandings ADD COLUMN phone text;

INSERT INTO public.sms_templates (event_type, label, message)
VALUES ('gespraech_erinnerung', 'Bewerbungsgespräch Erinnerung', 'Hallo {name}, Sie hatten einen Termin bei uns, waren aber leider nicht erreichbar. Bitte rufen Sie uns an: {telefon}.');