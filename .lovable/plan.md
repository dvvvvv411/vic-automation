## Problem

Janina Smith konnte einen 1. Arbeitstag am **Fr., 03.07.2026 10:00** buchen, obwohl im Zeitplan (`branding_schedule_settings`, `schedule_type='trial'`) für dieses Branding `available_days = [1,2,3,4,6]` gespeichert ist — Freitag (5) ist gesperrt.

Ursache: Die RPC `book_first_workday_public` schreibt den Termin **ohne serverseitige Validierung**. Nur das Frontend prüft die verfügbaren Wochentage; wird das umgangen (veraltete Query-Daten, direkter RPC-Call, nachträglich geänderte Einstellungen), landet der Termin trotzdem in der DB.

## Fix

**Migration:** `book_first_workday_public` (SECURITY DEFINER) um serverseitige Validierung erweitern:

1. `branding_id` des Contracts ermitteln.
2. `branding_schedule_settings` mit `schedule_type='trial'` laden (Fallback: `available_days=[1..6]`, 08:00–18:00, 30 min).
3. Vor dem INSERT prüfen:
   - ISO-Wochentag von `_appointment_date` muss in `available_days` enthalten sein → sonst `RAISE EXCEPTION 'Dieser Wochentag ist nicht verfügbar'`.
   - `_appointment_time` muss im gültigen Zeitfenster liegen (Wochenende ggf. `weekend_*_time`) → sonst Exception.
   - `_appointment_time` darf nicht in `first_workday_blocked_slots` oder `trial_day_blocked_slots` für dieses Datum + Branding stehen → sonst Exception.
   - Kombination `(_appointment_date, _appointment_time)` darf noch nicht als gebucht existieren (Doppelbuchung) → sonst Exception.
4. Frontend (`ErsterArbeitstag.tsx`) fängt die neuen Exceptions in der Mutation und zeigt Toast "Dieser Termin ist nicht mehr verfügbar. Bitte wählen Sie einen anderen."

## Datenkorrektur

Bestehender Fehl-Termin von Janina Smith (Fr 03.07.2026 10:00) **bleibt bestehen** — keine Löschung.

## Nicht betroffen

- Trial- und Interview-Buchung — analoge Absicherung in Folge-Ticket möglich.
- Admin-Erstellungen und Reschedules via Admin-Panel (nutzen diese RPC nicht).
- Kein UI-Redesign, kein Schema-Change an Tabellen.
