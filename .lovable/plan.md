

## Plan: Automatische SMS-Erinnerungen 24h vor Terminen

### Uebersicht

Eine neue Edge Function `send-appointment-reminders` wird stuendlich per `pg_cron` aufgerufen. Sie prueft ob Termine in den naechsten 24-25h anstehen, laedt das SMS-Template aus der DB, sendet die SMS via bestehende `send-sms` Edge Function (die automatisch in `sms_logs` mit `branding_id` loggt), und markiert den Termin als erinnert.

### Aenderungen

| # | Ort | Was |
|---|-----|-----|
| 1 | **DB Migration** | `reminder_sent` Boolean-Spalte auf `interview_appointments` und `trial_day_appointments` |
| 2 | **DB Insert** | Zwei neue SMS-Templates: `gespraech_erinnerung_auto`, `probetag_erinnerung_auto` |
| 3 | **Edge Function** | Neue `send-appointment-reminders/index.ts` |
| 4 | **`supabase/config.toml`** | `verify_jwt = false` fuer neue Function |
| 5 | **`AdminSmsTemplates.tsx`** | Platzhalter fuer neue Templates registrieren |
| 6 | **pg_cron SQL** | Stuendlicher Cron-Job via Supabase Insert-Tool (nicht Migration, da projektspezifische Daten) |

### DB Migration

```sql
ALTER TABLE interview_appointments 
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
ALTER TABLE trial_day_appointments 
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
```

### DB Insert (neue Templates)

```sql
INSERT INTO sms_templates (event_type, label, message) VALUES
  ('gespraech_erinnerung_auto', 'Bewerbungsgespräch Erinnerung (24h)', 
   'Hallo {name}, zur Erinnerung: Morgen um {uhrzeit} Uhr findet Ihr Bewerbungsgespräch statt. Wir freuen uns auf Sie!'),
  ('probetag_erinnerung_auto', 'Probetag Erinnerung (24h)', 
   'Hallo {name}, zur Erinnerung: Morgen um {uhrzeit} Uhr ist Ihr Probetag. Wir freuen uns auf Sie!')
ON CONFLICT DO NOTHING;
```

### Edge Function Logik (`send-appointment-reminders`)

1. Query `interview_appointments` WHERE `appointment_date + appointment_time` zwischen jetzt und jetzt+25h, `reminder_sent = false`, `status = 'neu'` — JOIN `applications` fuer Name, Phone, `branding_id`
2. Dasselbe fuer `trial_day_appointments`
3. Fuer jeden Termin:
   - SMS-Template aus `sms_templates` laden (`gespraech_erinnerung_auto` / `probetag_erinnerung_auto`)
   - Platzhalter ersetzen (`{name}`, `{uhrzeit}`, `{datum}`)
   - SMS senden via internen Aufruf der `send-sms` Edge Function (die loggt automatisch in `sms_logs` mit `branding_id` und `event_type`)
   - `reminder_sent = true` setzen
4. Response: Anzahl gesendeter Erinnerungen

### Branding & SMS-History

Die SMS wird ueber die bestehende `send-sms` Function gesendet, die automatisch:
- In `sms_logs` loggt (erscheint in SMS-History)
- `branding_id` mitspeichert (Branding-Filterung funktioniert)
- `event_type` setzt (`gespraech_erinnerung_auto` / `probetag_erinnerung_auto`)
- Absendername aus dem Branding nutzt (`sms_sender_name`)

### pg_cron Job (via Insert-Tool, nicht Migration)

```sql
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
```

### Warum 25h-Fenster?

Bei stuendlicher Ausfuehrung deckt ein 25h-Fenster sicher ab, dass kein Termin uebersprungen wird. `reminder_sent` verhindert Doppel-Versand.

### AdminSmsTemplates.tsx

Neue Eintraege in `PLACEHOLDER_INFO`:
```
gespraech_erinnerung_auto: ["{name}", "{datum}", "{uhrzeit}"]
probetag_erinnerung_auto: ["{name}", "{datum}", "{uhrzeit}"]
```

