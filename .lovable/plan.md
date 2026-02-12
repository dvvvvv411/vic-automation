

# Fix: Confirmation-Page wird nicht angezeigt bei bereits gebuchtem Termin

## Problem

Die Supabase-Query in `Bewerbungsgespraech.tsx` nutzt einen verschachtelten Select:

```
.select("*, brandings(...), interview_appointments(appointment_date, appointment_time)")
```

Damit PostgREST diese Beziehung aufloesen kann, muss ein **Foreign Key** zwischen `interview_appointments.application_id` und `applications.id` existieren. Dieser fehlt aktuell in der Datenbank. Deshalb kommt `interview_appointments` immer als leeres Array zurueck und die Bedingung `existingAppointment` ist nie wahr.

## Loesung

Eine neue Migration erstellen, die den fehlenden Foreign Key hinzufuegt:

```sql
ALTER TABLE public.interview_appointments
ADD CONSTRAINT interview_appointments_application_id_fkey
FOREIGN KEY (application_id) REFERENCES public.applications(id);
```

## Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `supabase/migrations/..._add_fk_interview_appointments.sql` | Neue Migration: Foreign Key von `interview_appointments.application_id` auf `applications.id` |

Keine Aenderungen am Frontend-Code noetig -- die Query und die Logik sind bereits korrekt implementiert, es fehlt nur die Datenbankbeziehung.

