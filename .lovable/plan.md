## Änderung

SMS-Erinnerungstext für `gespraech_erinnerung` umschreiben.

## Neuer Text (kurz)

> "Hallo {name}, Erinnerung: Ihr Bewerbungsgespräch steht an. Falls Sie nicht teilnehmen können, buchen Sie einen neuen Termin über den Link in Ihrer E-Mail."

## Umsetzung

1. **DB-Migration** — `sms_templates.message` für `event_type = 'gespraech_erinnerung'` auf den neuen Text aktualisieren.
2. **Fallback im Code** — In `AdminBewerbungsgespraeche.tsx` (`handlePrepareReminder`) den Fallback-Text gleich mitziehen.
3. **E-Mail** — Bleibt unverändert (Button "Termin umbuchen" + Hinweis auf Neu-Buchung sind schon passend).