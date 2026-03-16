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