
# Bewertungs-Redirect + Auftraege-Seite

## 1. Redirect nach Bewertung aendern

In `src/pages/mitarbeiter/Bewertung.tsx` wird nach erfolgreichem Absenden der Bewertung aktuell zu `/mitarbeiter/auftragdetails/:id` navigiert. Das wird geaendert zu `/mitarbeiter`, damit der Mitarbeiter zurueck zum Dashboard gelangt.

## 2. Neuer Sidebar-Reiter "Auftraege"

In `src/components/mitarbeiter/MitarbeiterSidebar.tsx` wird ein zweiter Navigationseintrag "Auftraege" mit dem `ClipboardList`-Icon hinzugefuegt, der zu `/mitarbeiter/auftraege` fuehrt.

## 3. Neue Seite `/mitarbeiter/auftraege`

Eine dedizierte Auftragsseite (`src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`) mit besserer Uebersicht als im Dashboard:

- **Filter-Tabs**: Alle / Offen / In Ueberpruefung / Erfolgreich / Fehlgeschlagen
- **Tabellen-Ansicht** statt Karten-Grid: Uebersichtliche Tabelle mit Spalten fuer Auftragsnummer, Titel, Anbieter, Praemie, Status (farbiger Badge) und Aktion-Button
- **Sortierung** nach Datum (neueste zuerst)
- Gleiche Datenquelle wie das Dashboard (order_assignments + orders)
- Nutzt `useOutletContext` fuer Contract-Daten

## 4. Routing

In `src/App.tsx` wird die neue Child-Route `auftraege` unter `/mitarbeiter` registriert.

## Aenderungen

| Datei | Aenderung |
|---|---|
| `src/pages/mitarbeiter/Bewertung.tsx` | Redirect von `/mitarbeiter/auftragdetails/:id` zu `/mitarbeiter` aendern |
| `src/components/mitarbeiter/MitarbeiterSidebar.tsx` | Neuer Nav-Eintrag "Auftraege" mit ClipboardList-Icon |
| `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx` | **Neue Datei** -- Auftraege-Seite mit Filter-Tabs und Tabellen-Ansicht |
| `src/App.tsx` | Neue Route `auftraege` als Child von `/mitarbeiter` |
