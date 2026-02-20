

# Stefan Hofmann Termin auf 10:40 umstellen

## Uebersicht

Der Termin von Stefan Hofmann am 04.03.2026 steht aktuell auf 10:30 Uhr. Da ab dem 02.03.2026 das neue 20-Minuten-Intervall gilt, existiert der Slot 10:30 nicht mehr (die Slots sind dann 10:00, 10:20, 10:40, 11:00, ...). Der Termin wird auf 10:40 Uhr umgestellt und der Slot blockiert.

## Aenderungen (direkt in der Datenbank)

### 1. Termin-Uhrzeit aendern

Das `interview_appointments`-Record (ID: `87610176-d3d1-4f45-ad70-6bad59347693`) wird von `10:30:00` auf `10:40:00` aktualisiert:

```sql
UPDATE interview_appointments
SET appointment_time = '10:40:00'
WHERE id = '87610176-d3d1-4f45-ad70-6bad59347693';
```

### 2. Slot blockieren

Ein neuer Eintrag in `schedule_blocked_slots` fuer den 04.03.2026 um 10:40 wird erstellt, damit kein weiterer Bewerber diesen Slot buchen kann:

```sql
INSERT INTO schedule_blocked_slots (blocked_date, blocked_time, reason)
VALUES ('2026-03-04', '10:40:00', 'Bewerbungsgespräch Stefan Hofmann');
```

## Keine Code-Aenderungen

Nur zwei SQL-Statements in der Datenbank.

