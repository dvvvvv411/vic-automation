## Ziel
Text der "Konto erstellt"-E-Mail in Registrierung und Admin-Vorschau ändern.

## Änderungen

1. **src/pages/Auth.tsx** (Zeile ~167–171)
   - `body_lines` aktualisieren auf neuen Text:
     - "Ihr Konto wurde erfolgreich erstellt. Ihnen wurden automatisch Starteraufträge zugewiesen."
     - "Bitte erledigen Sie die Starteraufträge zeitnah. Nach erfolgreicher Überprüfung melden wir uns bei Ihnen nochmal."
   - `button_text` entfernen oder leer lassen (kein Call-to-Action mehr nötig).

2. **src/pages/admin/AdminEmails.tsx** (Zeile ~199–203)
   - Gleiche Textänderung im `konto_erstellt`-Template für die Admin-Vorschau.

## Keine DB-Migration nötig
Dies ist reiner Code-Text; die E-Mail-Vorlage in `sms_templates` betrifft diesen Flow nicht.