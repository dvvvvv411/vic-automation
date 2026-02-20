

# Startdatum-Spalte in Arbeitsvertraege-Tabelle

## Uebersicht

Neue Spalte "Startdatum" in der Tabelle auf `/admin/arbeitsvertraege`, die das gewuenschte Startdatum aus dem eingereichten Vertrag anzeigt.

## Aenderung in `src/pages/admin/AdminArbeitsvertraege.tsx`

1. **Neuen TableHead** "Startdatum" zwischen "Vertragsstatus" und "Aktionen" einfuegen.
2. **Neues TableCell** das `item.contract?.desired_start_date` anzeigt, formatiert mit `format()` und deutscher Locale (z.B. "15. März 2026"). Wenn kein Datum vorhanden: "–".

### Technisch

- Keine neuen Imports noetig (`format` und `de` sind bereits importiert)
- Keine Datenbank-Aenderungen (das Feld `desired_start_date` existiert bereits in `employment_contracts` und wird schon abgefragt)

