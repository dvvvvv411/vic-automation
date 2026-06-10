# Falsche Projekt-URL korrigieren

## Befund
Suche nach `luorlnagxpsibarcygjm` ergab:
- **Code (alle Dateien inkl. `.env`, edge functions, configs):** keine Treffer ✅
- **`cron.job`:** 1 Treffer → Job `appointment-reminders-hourly` (jobid 1) ruft stündlich die `send-appointment-reminders`-Function im **falschen Projekt** auf und nutzt dessen Anon-Key.

Konsequenz: SMS-Terminerinnerungen werden in diesem Projekt nie angetriggert.

## Fix
Cron-Job neu registrieren mit korrekter URL (`laozvnaupdecerpvwzmh`) und dem Anon-Key dieses Projekts:

```sql
SELECT cron.unschedule('appointment-reminders-hourly');

SELECT cron.schedule(
  'appointment-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://laozvnaupdecerpvwzmh.supabase.co/functions/v1/send-appointment-reminders',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3p2bmF1cGRlY2VycHZ3em1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzEwNjUsImV4cCI6MjA5NDM0NzA2NX0.uXLnpeKILEDBoC8yCcX1ZL-hdlhFPUl-bVYcoxHKu2Y"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Wird via `supabase--insert` ausgeführt (kein Migration-Tool, weil projekt-spezifische URL + Key).

## Verifikation
1. `SELECT jobname, schedule, active FROM cron.job;` → `appointment-reminders-hourly` zeigt jetzt auf `laozvnaupdecerpvwzmh`.
2. Direkter Testaufruf der Edge Function via `supabase--curl_edge_functions` → Response `{ success: true, sent: N }`.
3. Nach nächster vollen Stunde: `cron.job_run_details` Status `succeeded` + neue Einträge in `sms_logs` mit `event_type` der drei Reminder-Templates.

## Hinweis
Andere Cron-Jobs (`process-email-queue-*`) nutzen bereits die korrekte URL `laozvnaupdecerpvwzmh` — kein Handlungsbedarf.
