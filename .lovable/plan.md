
# Startdatum und Hinweis zum ersten Auftrag in der Genehmigungs-E-Mail

## Uebersicht

In der E-Mail "Ihr Mitarbeiterkonto wurde erstellt" (event_type `vertrag_genehmigt`) werden zwei neue Zeilen nach "Bitte loggen Sie sich ein und unterzeichnen Sie Ihren Arbeitsvertrag." eingefuegt:

1. Das Startdatum des Mitarbeiters
2. Ein Hinweis, dass am Morgen des Startdatums der erste Auftrag im Dashboard bereitsteht

## Aenderungen

### 1. Edge Function `supabase/functions/create-employee-account/index.ts`

In den `body_lines` (Zeile 175-181) nach der Zeile "Bitte loggen Sie sich ein und unterzeichnen Sie Ihren Arbeitsvertrag." zwei neue Zeilen einfuegen:

```
"Ihr Startdatum ist der 15. Maerz 2026."
"Am Morgen Ihres Startdatums finden Sie Ihren ersten Auftrag in Ihrem Dashboard."
```

Das Datum wird aus `contract.desired_start_date` gelesen und mit deutschem Format dargestellt. Dafuer wird das Datum manuell formatiert (kein date-fns in Deno verfuegbar, daher einfache Formatierung mit deutschem Monatsnamen).

### 2. Vorschau-Template `src/pages/admin/AdminEmails.tsx`

Das Template fuer `vertrag_genehmigt` (Zeile 137-152) bekommt die gleichen zwei neuen Zeilen in `bodyLines`, damit die Vorschau uebereinstimmt.

## Keine Datenbank-Aenderungen

Nur Aenderungen in der Edge Function und der Vorschau-Seite.
