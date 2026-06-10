## Ziel
Folgende E-Mails sollen NICHT mehr versendet werden (SMS bleibt unverändert):

1. **Termin-Erinnerungen** (Bewerbungsgespräch, Probetag) → nur noch SMS
2. **Auftrag zugewiesen** → nur noch SMS
3. **Auftrag erfolgreich / abgelehnt** (Bewertung genehmigt/abgelehnt) → nur noch SMS

Erfolgs-/Bestätigungs-Mails für Termine (z. B. „Bewerbungsgespräch erfolgreich", „Probetag erfolgreich") sowie Buchungsbestätigungen bleiben **erhalten**, da sie keine Erinnerungen sind.

## Änderungen im Detail

### 1. Erinnerungen
- `src/pages/admin/AdminBewerbungsgespraeche.tsx` (≈ Zeile 298)
  → `sendEmail({ … event_type: "gespraech_erinnerung" })` entfernen.
  → Toast-Texte anpassen („Erinnerung per SMS gesendet").
- `src/pages/admin/AdminProbetag.tsx` (≈ Zeile 155)
  → `sendEmail({ … event_type: "probetag_erinnerung" })` entfernen.
  → Toast-Texte anpassen.
- `1. Arbeitstag-Erinnerung`: aktuell keine Email-Trigger im Frontend; Cron `send-appointment-reminders` verschickt bereits nur SMS → keine Änderung nötig.

### 2. Auftrag zugewiesen
- `src/components/admin/AssignmentDialog.tsx` (≈ Zeile 205)
  → `sendEmail({ … event_type: "auftrag_zugewiesen" })` entfernen.
  → SMS-Versand bleibt.

### 3. Auftrag erfolgreich / abgelehnt (Bewertung)
- `src/pages/admin/AdminBewertungen.tsx`
  - Zeile ≈ 254: `sendEmail` für `bewertung_genehmigt` (= Auftrag erfolgreich) entfernen.
  - Zeile ≈ 322: `sendEmail` für `bewertung_abgelehnt` entfernen.
- `src/pages/admin/AdminMitarbeiterDetail.tsx`
  - Zeile ≈ 606: `sendEmail` für `bewertung_genehmigt` entfernen.
  - Zeile ≈ 664: `sendEmail` für `bewertung_abgelehnt` entfernen.

In allen vier Fällen Toast-Meldungen anpassen, sodass nur noch von SMS gesprochen wird; SMS-Logik unverändert lassen.

## Was unverändert bleibt
- Bestätigungs-/Buchungs-Mails für Termine, „Bewerbungsgespräch erfolgreich", „Probetag erfolgreich", „Vertrag genehmigt", Account-/Bewerbungs-Mails etc.
- Alle SMS-Aufrufe.
- DB / Edge Functions (außer evtl. nicht benötigte `event_type`-Templates, die nicht entfernt werden, da sie im Admin-Template-Editor weiter sichtbar bleiben sollen).

## Test
Nach den Änderungen für jeden der drei Anwendungsfälle einmal auslösen und prüfen, dass nur eine SMS verschickt und keine Email in `email_send_log` für die betreffenden `event_type`s erzeugt wird.
