
# Neuer Reiter "Zeitplan" unter Einstellungen + Integration in Buchungsseite

## Uebersicht

Ein neuer Admin-Bereich unter `/admin/zeitplan` (Einstellungen-Gruppe) zum Konfigurieren der verfuegbaren Zeitspanne fuer Bewerbungsgespraeche und zum manuellen Blockieren einzelner Zeitfenster. Die oeffentliche Buchungsseite `/bewerbungsgespraech/:id` prueft diese Einstellungen.

## Datenbank-Aenderungen

### Neue Tabelle: `schedule_settings`

Speichert die globale Zeitspanne (Start- und Enduhrzeit) sowie die verfuegbaren Wochentage.

| Spalte | Typ | Default | Beschreibung |
|--------|-----|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| start_time | time | 08:00 | Frueheste buchbare Uhrzeit |
| end_time | time | 18:00 | Spaeteste buchbare Uhrzeit |
| slot_interval_minutes | integer | 30 | Intervall zwischen Slots |
| available_days | integer[] | {1,2,3,4,5,6} | Wochentage (1=Mo, 7=So) |
| created_at | timestamptz | now() | Erstellungsdatum |

RLS: Admins koennen lesen/schreiben, Anon kann lesen (fuer Buchungsseite).

### Neue Tabelle: `schedule_blocked_slots`

Speichert manuell blockierte Zeitfenster (z.B. "Am 25.02.2026 von 10:00-12:00 bin ich nicht da").

| Spalte | Typ | Default | Beschreibung |
|--------|-----|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| blocked_date | date | -- | Das blockierte Datum |
| blocked_time | time | -- | Die blockierte Uhrzeit |
| reason | text | null | Optionaler Grund |
| created_at | timestamptz | now() | Erstellungsdatum |

RLS: Admins koennen lesen/schreiben/loeschen, Anon kann lesen (fuer Buchungsseite).

## Neue Admin-Seite: `/admin/zeitplan`

Die Seite hat zwei Bereiche:

### Bereich 1: Allgemeine Zeiteinstellungen

- Startzeit (z.B. 08:00) und Endzeit (z.B. 18:00) als Select-Felder
- Intervall (30 Min fest oder konfigurierbar)
- Wochentage als Checkboxen (Mo-So), standardmaessig Mo-Sa aktiv
- Speichern-Button

### Bereich 2: Zeiten blockieren

- Kalender-Ansicht zum Auswaehlen eines Datums
- Nach Datumsauswahl: Zeitslots anzeigen (basierend auf den allgemeinen Einstellungen)
- Einzelne Slots per Klick blockieren/freigeben (Toggle)
- Optionaler Grund-Text beim Blockieren
- Liste der aktuell blockierten Slots mit Loeschen-Button

## Aenderungen an bestehenden Dateien

### `src/App.tsx`
- Neue Route `/admin/zeitplan` mit der neuen Seite

### `src/components/admin/AdminSidebar.tsx`
- Neuer Eintrag "Zeitplan" in der Einstellungen-Gruppe mit `Clock`-Icon

### `src/pages/Bewerbungsgespraech.tsx`
- `TIME_SLOTS` nicht mehr hardcoded, sondern aus `schedule_settings` laden
- Zusaetzlich `schedule_blocked_slots` laden und diese Slots als nicht buchbar markieren (wie bereits gebuchte Termine)
- `available_days` aus den Settings pruefen statt nur `isSunday`

## Dateien

| Datei | Aenderung |
|-------|----------|
| Migration SQL | Neue Tabellen `schedule_settings` und `schedule_blocked_slots` mit RLS |
| `src/pages/admin/AdminZeitplan.tsx` | Neue Seite (Zeiteinstellungen + Blockierungen) |
| `src/App.tsx` | Route `/admin/zeitplan` hinzufuegen |
| `src/components/admin/AdminSidebar.tsx` | "Zeitplan" in Einstellungen-Gruppe |
| `src/pages/Bewerbungsgespraech.tsx` | Dynamische Slots aus DB laden, blockierte Slots beruecksichtigen |
