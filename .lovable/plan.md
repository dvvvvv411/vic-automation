# Fix: "Verdienst 0h und 0€" auf Auftragscards ausblenden

## Problem
Auf den Auftragscards (Dashboard & Aufträge-Seite) erscheint bei erfolgreichen Aufträgen eine Zeile "Verdienst (0.0 Std.) 0.00 €", obwohl das Branding auf Vertragsbasis (festes Gehalt) eingestellt ist und keine Stundenvergütung relevant ist. Ursache: Das Flag `hourly_rate_enabled` ist am Branding aktiviert (oder `estimated_hours` ist 0), wodurch der Block trotzdem gerendert wird.

## Lösung
Den Verdienst-Block nur anzeigen, wenn:
- `isHourlyRate === true` **und**
- `estimated_hours > 0` **und**
- berechneter Verdienst `> 0`

Andernfalls den gesamten Block (inkl. Label "Verdienst") komplett ausblenden — kein 0-Wert-Anzeige.

## Betroffene Datei
- `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx` (Zeilen ~360–377): Bedingung der `if (isHourlyRate && a.status === "erfolgreich")` Branch erweitern, sodass bei `hours <= 0` oder `earnings <= 0` nichts gerendert wird (return `null`), statt "0.0 Std. / 0.00 €".

## Keine weiteren Änderungen
- Dashboard (`MitarbeiterDashboard.tsx`) zeigt bereits korrekt nichts bei `isFixedSalary`.
- Logik für reguläre Prämie (Nicht-Fixed-Salary) bleibt unverändert.
- Keine DB-Änderungen.
