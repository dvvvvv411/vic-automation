

## Plan: Email & Telegram Notifications Ueberarbeitung

### Zusammenfassung der Aenderungen

**Entfernen:**
1. `bewerbung_abgelehnt` Email — keine Ablehnungsmail mehr senden
2. `probetag_erfolgreich` Email — nicht noetig da User schon Konto hat
3. `termin_gebucht` Email (Auftragstermin) — entfernen

**Umfunktionieren:**
4. `vertrag_genehmigt` Email — kein Passwort/Zugangsdaten mehr, sondern reine Benachrichtigung "Ihr Vertrag wurde genehmigt". Wird in `AdminArbeitsvertraege.tsx` nach `approve_employment_contract` RPC gesendet (nicht mehr in der `create-employee-account` Edge Function)
5. `gespraech_erfolgreich` Email-Vorschau in `AdminEmails.tsx` — Text und Button anpassen auf "Probetag buchen" (der eigentliche Versand-Code ist bereits korrekt)

**Neu hinzufuegen:**
6. `konto_erstellt` Email — nach Selbstregistrierung in `Auth.tsx`, informiert ueber Starterjobs und Vertragseinreichung
7. `vertrag_eingereicht` Email — Bestaetigung an User nach Einreichung (in `MitarbeiterArbeitsvertrag.tsx` und `Arbeitsvertrag.tsx`)
8. `auftrag_erfolgreich` Email — wenn Auftrag komplett abgeschlossen. Bei `per_order` Verguetungsmodell mit Praemie, bei `festgehalt` allgemeine Erfolgsmeldung

**Neue Telegram Notifications:**
9. `anhaenge_eingereicht` — in `AuftragDetails.tsx` nach `handleSubmitAttachments`
10. `konto_erstellt` — in `Auth.tsx` nach erfolgreicher Registrierung
11. `ident_gestartet` — in `AuftragDetails.tsx` nach `handleStartVideoIdent`

### Dateien und Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/AdminBewerbungen.tsx` | `rejectMutation`: `sendEmail`-Aufruf fuer `bewerbung_abgelehnt` entfernen |
| `src/pages/admin/AdminProbetag.tsx` | `probetag_erfolgreich` Email-Block komplett entfernen |
| `src/pages/admin/AdminArbeitsvertraege.tsx` | Nach `approve_employment_contract` RPC: neue schlichte `vertrag_genehmigt` Email senden (ohne Passwort, nur "Vertrag genehmigt" Benachrichtigung) |
| `supabase/functions/create-employee-account/index.ts` | Den gesamten Email-Versand-Block entfernen (Zeilen 155-182), da Vertragsgenehmigung jetzt ueber `AdminArbeitsvertraege.tsx` laeuft |
| `src/pages/Auth.tsx` | Nach Registrierung: `sendEmail` mit `konto_erstellt` und `sendTelegram` mit `konto_erstellt` aufrufen |
| `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx` | Nach Einreichung: `sendEmail` mit `vertrag_eingereicht` aufrufen |
| `src/pages/Arbeitsvertrag.tsx` | Nach Einreichung: `sendEmail` mit `vertrag_eingereicht` aufrufen |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | `handleSubmitAttachments`: `sendTelegram("anhaenge_eingereicht", ...)` hinzufuegen; `handleStartVideoIdent`: `sendTelegram("ident_gestartet", ...)` hinzufuegen |
| `src/pages/admin/AdminBewertungen.tsx` | Wenn `finalStatus === "erfolgreich"`: statt nur `bewertung_genehmigt` eine `auftrag_erfolgreich` Email senden, Praemie-Text abhaengig vom payment_model des Brandings |
| `src/pages/admin/AdminMitarbeiterDetail.tsx` | Analog: `handleReviewApprove` bei `erfolgreich` → `auftrag_erfolgreich` Email mit Praemie/Festgehalt-Unterscheidung |
| `src/pages/admin/AdminEmails.tsx` | Preview-Templates aktualisieren: `bewerbung_abgelehnt` und `probetag_erfolgreich` und `termin_gebucht` entfernen; `gespraech_erfolgreich` Text/Button auf "Probetag buchen" aendern; `vertrag_genehmigt` vereinfachen (kein Passwort); neue Previews fuer `konto_erstellt`, `vertrag_eingereicht`, `auftrag_erfolgreich` hinzufuegen |
| `src/pages/admin/AdminSmsTemplates.tsx` | `vertrag_genehmigt` Platzhalter anpassen (kein `{link}` mehr noetig); `termin_gebucht` entfernen |
| `src/pages/admin/AdminTelegram.tsx` | Neue Events `konto_erstellt`, `anhaenge_eingereicht`, `ident_gestartet` zur Event-Liste hinzufuegen |
| `src/components/admin/AssignmentDialog.tsx` | `termin_gebucht` Email entfernen (falls vorhanden) |

### Auftrag erfolgreich — Payment Model Logik

Beim Senden der `auftrag_erfolgreich` Email wird das Branding geladen und `payment_model` geprueft:
- `per_order`: "Die Praemie von X€ wurde Ihrem Konto gutgeschrieben."
- `festgehalt`: "Ihr Auftrag wurde erfolgreich abgeschlossen. Vielen Dank fuer Ihre Mitarbeit."

### Keine DB-Migration noetig

Alle Telegram-Events werden dynamisch als Strings behandelt und muessen nur in der UI-Event-Liste registriert werden.

