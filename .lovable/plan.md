## Ziel
Die Email, die nach dem Markieren eines Bewerbungsgesprächs als "erfolgreich" verschickt wird, soll nicht mehr zum Probetag-Buchen auffordern, sondern den Bewerber bitten, seine Vertragsdaten im Portal einzureichen. Termin für 1. Arbeitstag wird wie bisher erst nach Vertragsgenehmigung gebucht.

## Änderungen

### 1) `src/pages/admin/AdminBewerbungsgespraeche.tsx`
- `handleStatusUpdate` (Zeile ~167): Neue Email statt Probetag-Link:
  - `subject`: "Ihr Bewerbungsgespräch war erfolgreich"
  - `body_title`: "Willkommen im Team"
  - `body_lines`:
    - `Sehr geehrte/r {Vorname} {Nachname},`
    - `wir haben Ihre Starteraufträge erfolgreich geprüft und würden Sie sehr gerne bei uns im Team begrüßen.`
    - `Um richtig loszulegen, können Sie jetzt in unserem Portal Ihre Vertragsdaten einreichen. Anschließend erhalten Sie die Möglichkeit, einen Termin für Ihren 1. Arbeitstag zu buchen.`
  - `button_text`: "Vertragsdaten einreichen"
  - `button_url`: `buildBrandingUrl(brandingId, /arbeitsvertrag/{application_id})` (gemäß Memory: Route nimmt application_id)
  - `event_type` bleibt `gespraech_erfolgreich`
- `handleResendProbetagEmail` (Zeile ~295): umbenennen zu `handleResendErfolgreichEmail`, gleichen neuen Inhalt verwenden. Tooltips/Toasts/Button-Titel "Probetag-Einladung erneut senden" → "Einladung erneut senden", Toast-Text "Einladung erneut gesendet!".
- Den "Probetag-Link kopieren"-Button (Zeile ~512–527) anpassen: Link kopiert nun den Arbeitsvertrag-Link statt Probetag-Link, Tooltip "Vertragsdaten-Link kopieren".
- Die Spalte "Probetag" und `_trialDay`-Anzeige bleiben unverändert (zeigt weiterhin gebuchte Probetage, falls vorhanden — andere Workflows können sie weiterhin nutzen).

### 2) `src/pages/admin/AdminEmails.tsx` (Vorschau-Template, Zeilen 182–194)
Vorschau-Template für `gespraech_erfolgreich` an den neuen Wortlaut angleichen:
- `subject`: "Ihr Bewerbungsgespräch war erfolgreich – {Branding}"
- `bodyTitle`: "Willkommen im Team"
- `bodyLines`: neuer Text (analog oben)
- `buttonText`: "Vertragsdaten einreichen"
- `buttonUrl`: Beispiel-Link `https://example.com/arbeitsvertrag/abc123`

## Nicht geändert
- Keine DB-Migration, keine Edge-Function-Änderung.
- Probetag-Routen/Funktionalität bleiben bestehen (nur Email-Trigger verweist nicht mehr darauf).
- `event_type` bleibt `gespraech_erfolgreich` für Konsistenz mit Logs und Vorschau.
