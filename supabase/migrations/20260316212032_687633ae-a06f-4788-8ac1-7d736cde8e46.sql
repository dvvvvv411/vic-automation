INSERT INTO sms_templates (event_type, label, message) VALUES
  ('gespraech_erinnerung_auto', 'Bewerbungsgespräch Erinnerung (24h)', 
   'Hallo {name}, zur Erinnerung: Morgen um {uhrzeit} Uhr findet Ihr Bewerbungsgespräch statt. Wir freuen uns auf Sie!'),
  ('probetag_erinnerung_auto', 'Probetag Erinnerung (24h)', 
   'Hallo {name}, zur Erinnerung: Morgen um {uhrzeit} Uhr ist Ihr Probetag. Wir freuen uns auf Sie!')
ON CONFLICT DO NOTHING;