
# Startdatum-Bestaetigung vor Genehmigung

## Uebersicht
Beim Klick auf "Genehmigen" im Vertragsdaten-Popup soll sich ein weiteres Dialog-Fenster oeffnen, in dem das vom Bewerber gewuenschte Startdatum in einem Kalender vorausgewaehlt angezeigt wird. Der Admin kann das Datum bestaetigen oder aendern und erst dann wird der Vertrag genehmigt.

## Ablauf

1. Admin klickt "Genehmigen" im Vertragsdaten-Dialog
2. Statt sofort `handleApprove` aufzurufen, oeffnet sich ein neues Bestaetigungs-Dialog
3. Der Kalender zeigt das `desired_start_date` des Vertrags vorausgewaehlt an
4. Der Admin kann das Datum beibehalten oder ein anderes waehlen
5. Klick auf "Genehmigen & Startdatum bestaetigen" fuehrt die eigentliche Genehmigung durch
6. Das gewaehlte Startdatum wird vor dem Aufruf der Edge Function in der Datenbank aktualisiert

## Technische Aenderungen

**Datei:** `src/pages/admin/AdminArbeitsvertraege.tsx`

### 1. Neue State-Variablen
- `startDateDialogOpen` (boolean) - steuert das Bestaetigungs-Dialog
- `confirmedStartDate` (Date | undefined) - das ausgewaehlte Startdatum im Kalender

### 2. Neue Imports
- `Calendar` aus `@/components/ui/calendar`
- `format` aus `date-fns`
- `de` Locale aus `date-fns/locale/de` fuer deutsche Kalenderanzeige

### 3. Genehmigen-Button Logik aendern
- Der "Genehmigen"-Button im Vertragsdaten-Dialog ruft nicht mehr direkt `handleApprove` auf
- Stattdessen setzt er `confirmedStartDate` auf das `desired_start_date` des Vertrags (als Date-Objekt geparst) und oeffnet `startDateDialogOpen`

### 4. Neuer Bestaetigungs-Dialog
- Zeigt einen Kalender (`Calendar` Komponente im `single`-Modus)
- Vorausgewaehlt ist das `desired_start_date` des Vertrags
- Anzeige des aktuell gewaehlten Datums als Text ueber dem Kalender
- Buttons: "Abbrechen" und "Genehmigen & Startdatum bestaetigen"

### 5. handleApprove erweitern
- Vor dem Edge-Function-Aufruf wird das `desired_start_date` in der Tabelle `employment_contracts` aktualisiert (falls vom Admin geaendert)
- Danach wird wie bisher `create-employee-account` aufgerufen
- Nach Erfolg werden beide Dialoge geschlossen
