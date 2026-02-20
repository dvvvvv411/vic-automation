

# Intervallwechsel ab einem bestimmten Datum

## Uebersicht

Zwei neue Spalten in der `schedule_settings`-Tabelle ermoeglichen es, ab einem Stichtag (z.B. 02.03.2026) ein anderes Zeitintervall zu verwenden. Vor dem Stichtag gilt das bisherige Intervall, danach das neue.

## Datenbank-Aenderung

Neue Spalten in `schedule_settings`:
- `new_slot_interval_minutes` (integer, nullable) -- das neue Intervall ab dem Stichtag
- `interval_change_date` (date, nullable) -- der Stichtag

## Aenderungen in `src/pages/admin/AdminZeitplan.tsx`

Neue Eingabefelder im Bereich "Allgemeine Zeiteinstellungen":
- **Datepicker oder Datumsfeld** fuer den Stichtag ("Intervall aendern ab")
- **Select** fuer das neue Intervall (15 / 20 / 30 / 60 Min)

Die `generateTimeSlots`-Logik beruecksichtigt beim Blockieren von Slots das ausgewaehlte Kalenderdatum: Liegt das Datum vor dem Stichtag, wird das alte Intervall verwendet; ab dem Stichtag das neue.

Beim Speichern werden `new_slot_interval_minutes` und `interval_change_date` mitgespeichert.

## Aenderungen in `src/pages/Bewerbungsgespraech.tsx`

Die oeffentliche Buchungsseite liest ebenfalls die neuen Felder und waehlt das passende Intervall basierend auf dem ausgewaehlten Buchungsdatum.

## Zusammenfassung

| Wo | Was |
|---|---|
| Datenbank | 2 neue nullable Spalten in `schedule_settings` |
| AdminZeitplan.tsx | Neue Eingabefelder + datumabhaengige Slot-Berechnung |
| Bewerbungsgespraech.tsx | Datumabhaengiges Intervall bei Buchung |

Nach dem Speichern mit Stichtag 02.03.2026 und neuem Intervall 20 Minuten werden alle Termine ab diesem Datum im 20-Minuten-Takt angezeigt, davor weiterhin im bisherigen Takt.

