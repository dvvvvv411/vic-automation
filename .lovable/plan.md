
# Bewerbungsgespraech-Seite: Vergangene Termine ausblenden und personalisieren

## 1. Vergangene Zeitslots ausblenden

Wenn der Nutzer den heutigen Tag auswaehlt, werden nur Zeitslots angezeigt, die in der Zukunft liegen. Beispiel: Um 11:56 Uhr werden nur Slots ab 12:00 Uhr angezeigt. An zukuenftigen Tagen werden weiterhin alle Slots (08:00-17:30) angezeigt.

**Umsetzung in `Bewerbungsgespraech.tsx`:**
- `isToday()` aus date-fns importieren
- Die angezeigte Slot-Liste filtern: Wenn `selectedDate` heute ist, nur Slots anzeigen deren Stunde/Minute nach der aktuellen Uhrzeit liegen
- Die Filterung geschieht vor dem Rendering, sodass vergangene Slots komplett unsichtbar sind (nicht nur ausgegraut)

## 2. Bewerber-Daten anzeigen (Name und Telefonnummer)

Unterhalb des Headers wird eine personalisierte Begruessung mit dem Namen des Bewerbers und seiner Telefonnummer angezeigt. Die Daten kommen bereits aus der bestehenden Query (`application.first_name`, `application.last_name`, `application.phone`).

**Umsetzung:**
- Neue Info-Card zwischen Header und Kalender mit:
  - Begruessungstext: "Hallo {Vorname} {Nachname}"
  - Telefonnummer-Anzeige mit Phone-Icon
- Auch auf der Confirmation Page den Namen des Bewerbers anzeigen

## Technische Details

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/Bewerbungsgespraech.tsx` | Zeitslot-Filter fuer heutigen Tag, Bewerber-Info-Card mit Name und Telefon |

### Keine neuen Dateien oder Abhaengigkeiten
