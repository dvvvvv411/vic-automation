

## Plan: Zeitplan-Tabs umstrukturieren, Probetag-Doppelbuchungen verhindern, Branding-bezogene Zeiteinstellungen

### Problem
1. `/probetag` erlaubt Doppelbuchungen (gleiche Uhrzeit wird mehrfach vergeben)
2. Beide öffentlichen Seiten (`/probetag`, `/bewerbungsgespraech`) lesen von der globalen `schedule_settings`-Tabelle statt von `branding_schedule_settings`
3. Blocked/Booked Slots werden nicht nach Branding gefiltert
4. Admin-Tabs: "Zeiteinstellungen" ist ein separater Tab, soll aber in "Bewerbungsgespräche" integriert werden
5. Probetage brauchen eigene Zeiteinstellungen (Start, Ende, Intervall, Wochentage)

### DB-Migration

**`branding_schedule_settings`**: Neue Spalte `schedule_type text NOT NULL DEFAULT 'interview'` hinzufuegen. Unique-Constraint von `(branding_id)` auf `(branding_id, schedule_type)` aendern. Damit kann jedes Branding separate Einstellungen fuer `'interview'` und `'trial'` haben.

```sql
ALTER TABLE branding_schedule_settings 
  ADD COLUMN schedule_type text NOT NULL DEFAULT 'interview';
ALTER TABLE branding_schedule_settings 
  DROP CONSTRAINT branding_schedule_settings_branding_id_key;
ALTER TABLE branding_schedule_settings 
  ADD CONSTRAINT branding_schedule_settings_branding_type_key 
  UNIQUE (branding_id, schedule_type);
```

### Admin-Seite `/admin/zeitplan` (AdminZeitplan.tsx)

- **Tab "Zeiteinstellungen" entfernen**
- **Tab "Bewerbungsgespräche"** (vorher "Gespräch blockieren"):
  - Oben: `BrandingScheduleForm` fuer `schedule_type='interview'` einbetten
  - Darunter: Kalender + Slot-Blocker (wie bisher)
- **Tab "Probetage"** (vorher "Probetag blockieren"):
  - Oben: `BrandingScheduleForm` fuer `schedule_type='trial'` einbetten
  - Darunter: `TrialDayBlocker` (wie bisher)
- Queries/Mutations: `schedule_type` Parameter bei upsert/select mitsenden

### TrialDayBlocker.tsx

- Zeitslots dynamisch aus `branding_schedule_settings` (type=`trial`) laden statt hartcodierte 30-Min-Slots
- Hardcoded `TIME_SLOTS` entfernen, stattdessen `generateTimeSlots()` mit den Branding-Settings verwenden

### Probetag.tsx (oeffentliche Buchungsseite)

- **Settings**: Von `branding_schedule_settings` lesen, gefiltert auf `branding_id = application.branding_id` und `schedule_type = 'trial'` (statt globale `schedule_settings`)
- **Blocked Slots**: `trial_day_blocked_slots` nach `branding_id` filtern
- **Booked Slots**: `trial_day_appointments` nach Branding filtern (ueber application.branding_id JOIN oder direkt), damit bereits gebuchte Zeiten ausgegraut werden und keine Doppelbuchungen moeglich sind
- Interval-Change-Logik entfernen (nicht relevant fuer branding_schedule_settings)

### Bewerbungsgespraech.tsx (oeffentliche Buchungsseite)

- **Settings**: Von `branding_schedule_settings` lesen, gefiltert auf `branding_id = application.branding_id` und `schedule_type = 'interview'` (statt globale `schedule_settings`)
- **Blocked Slots**: `schedule_blocked_slots` nach `branding_id` filtern
- **Booked Slots**: `interview_appointments` nach Branding filtern
- Interval-Change-Logik entfernen

### Dateien

| Datei | Aenderung |
|-------|-----------|
| DB-Migration | `schedule_type` Spalte + Constraint |
| `AdminZeitplan.tsx` | 2 Tabs statt 3, Settings-Form in jeden Tab integrieren |
| `TrialDayBlocker.tsx` | Dynamische Slots aus Branding-Settings |
| `Probetag.tsx` | Branding-Settings statt global, Branding-Filter, Doppelbuchungsschutz |
| `Bewerbungsgespraech.tsx` | Branding-Settings statt global, Branding-Filter |

