
# E-Mail-Benachrichtigungssystem mit Resend

## Uebersicht

Eine zentrale Edge Function `send-email` wird erstellt, die alle E-Mails ueber die branding-spezifische Resend-Konfiguration versendet. Jede E-Mail wird in einheitlichem, serioesem Design gerendert (HTML-Template mit Branding-Farbe und Logo). Die Emails werden an den relevanten Stellen im Frontend und in bestehenden Edge Functions ausgeloest. Zusaetzlich wird eine Admin-Seite unter `/admin/emails` erstellt, die alle E-Mail-Ereignisse dokumentiert.

## E-Mail-Ereignisse

| Nr | Ereignis | Ausgeloest wo | Empfaenger | Inhalt |
|----|----------|---------------|------------|--------|
| 1 | Bewerbung eingegangen | `submit-application` Edge Function | Bewerber | Bestaetigung des Bewerbungseingangs |
| 2 | Bewerbung angenommen | `AdminBewerbungen.tsx` (acceptMutation) | Bewerber | Mitteilung + Button zum Gespraechstermin buchen |
| 3 | Bewerbung abgelehnt | Neuer Button in `AdminBewerbungen.tsx` | Bewerber | Absage-Mitteilung |
| 4 | Bewerbungsgespraech erfolgreich | `AdminBewerbungsgespraeche.tsx` (handleStatusUpdate "erfolgreich") | Bewerber | Mitteilung + Link zur Arbeitsvertrag-Seite |
| 5 | Arbeitsvertrag genehmigt | `create-employee-account` Edge Function | Mitarbeiter | Zugangsdaten (E-Mail + temp. Passwort) + Login-Link + Hinweis: Vertrag muss unterzeichnet werden |
| 6 | Arbeitsvertrag unterzeichnet | `sign-contract` Edge Function | Mitarbeiter | Bestaetigung der Unterschrift |
| 7 | Neuer Auftrag zugewiesen | `AssignmentDialog.tsx` (saveMutation) | Mitarbeiter | Benachrichtigung ueber neuen Auftrag mit Auftragsdetails |
| 8 | Auftragstermin gebucht | Frontend (order_appointments Insert) | Mitarbeiter | Bestaetigung des gebuchten Termins |
| 9 | Bewertung genehmigt | `AdminBewertungen.tsx` (handleApprove) | Mitarbeiter | Praemie gutgeschrieben, Bewertung akzeptiert |
| 10 | Bewertung abgelehnt | `AdminBewertungen.tsx` (handleReject) | Mitarbeiter | Bewertung abgelehnt, erneute Durchfuehrung moeglich |

## Technische Architektur

### 1. Neue Edge Function: `send-email`

**Datei:** `supabase/functions/send-email/index.ts`

- Empfaengt: `{ to, subject, html, branding_id }` (oder alternativ `application_id` / `contract_id` um das Branding automatisch aufzuloesen)
- Liest die Resend-Konfiguration (`resend_api_key`, `resend_from_email`, `resend_from_name`) aus der `brandings`-Tabelle
- Liest optional `logo_url` und `brand_color` fuer das E-Mail-Template
- Konvertiert das Logo zu Base64 (falls moeglich) oder verwendet die URL direkt
- Sendet die E-Mail ueber die Resend API (`https://api.resend.com/emails`)
- Loggt die E-Mail in eine neue `email_logs`-Tabelle
- JWT-Verifizierung deaktiviert (wird intern aufgerufen), aber mit Service-Role-Key abgesichert

**E-Mail-Template (HTML):**
- Serioes, modern, ohne Emojis
- Header: Logo (aus Branding) + Firmenname
- Farbakzent: `brand_color` aus Branding (fuer Header-Hintergrund, Buttons)
- Body: Weisser Hintergrund, klare Typografie
- Buttons: In Branding-Farbe, mit passenden Links
- Footer: Firmenname, Adresse aus Branding

### 2. Neue Datenbanktabelle: `email_logs`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| created_at | timestamptz | Zeitstempel |
| event_type | text | Ereignistyp (z.B. "bewerbung_eingegangen") |
| recipient_email | text | Empfaenger-E-Mail |
| recipient_name | text | Empfaenger-Name |
| subject | text | Betreff |
| branding_id | uuid | Zugehoeriges Branding |
| status | text | "sent" oder "failed" |
| error_message | text | Fehlermeldung bei Fehlschlag |
| metadata | jsonb | Zusaetzliche Daten (application_id, contract_id etc.) |

RLS: Nur Admins koennen lesen. Kein Insert/Update/Delete von Frontend - nur ueber Service Role in Edge Functions.

### 3. Aenderungen an bestehenden Edge Functions

**`submit-application/index.ts`:**
- Nach erfolgreichem Insert: `send-email` aufrufen mit event_type "bewerbung_eingegangen"
- Branding-ID aus der Bewerbung verwenden

**`create-employee-account/index.ts`:**
- Nach erfolgreicher Kontenerstellung: `send-email` aufrufen mit event_type "vertrag_genehmigt"
- E-Mail enthaelt: Zugangsdaten, Login-Link, Hinweis auf Vertragsunterzeichnung

**`sign-contract/index.ts`:**
- Nach erfolgreicher Unterschrift: `send-email` aufrufen mit event_type "vertrag_unterzeichnet"

### 4. Aenderungen im Frontend (E-Mail-Trigger via Edge Function Aufruf)

**`AdminBewerbungen.tsx`:**
- Bei "Akzeptieren": Nach Status-Update `send-email` mit event_type "bewerbung_angenommen" aufrufen
- Neuer Button "Ablehnen": Status auf "abgelehnt" setzen + `send-email` mit event_type "bewerbung_abgelehnt"

**`AdminBewerbungsgespraeche.tsx`:**
- Bei Status "erfolgreich": `send-email` mit event_type "gespraech_erfolgreich" aufrufen (Link zum Arbeitsvertrag)

**`AssignmentDialog.tsx`:**
- Nach Insert neuer Zuweisungen: `send-email` pro neuem Mitarbeiter mit event_type "auftrag_zugewiesen"

**`AuftragDetails.tsx` oder relevante Termin-Buchung:**
- Nach Terminbuchung: `send-email` mit event_type "termin_gebucht"

**`AdminBewertungen.tsx`:**
- Bei Genehmigung: `send-email` mit event_type "bewertung_genehmigt"
- Bei Ablehnung: `send-email` mit event_type "bewertung_abgelehnt"

### 5. Admin E-Mail-Uebersicht

**Neue Datei:** `src/pages/admin/AdminEmails.tsx`
- Zeigt alle Eintraege aus `email_logs` tabellarisch an
- Spalten: Datum, Ereignis, Empfaenger, Betreff, Status (gesendet/fehlgeschlagen), Branding
- Farbige Badges fuer Status und Ereignistyp
- Filterbar nach Ereignistyp
- Sortiert nach Datum (neueste zuerst)

**Sidebar (`AdminSidebar.tsx`):**
- Neuer Eintrag unter "Einstellungen": "E-Mails" mit Mail-Icon, Route `/admin/emails`

**Router (`App.tsx`):**
- Neue Route: `<Route path="emails" element={<AdminEmails />} />`

### 6. Config-Anpassung

**`supabase/config.toml`:**
```
[functions.send-email]
verify_jwt = false
```

## Zusammenfassung der neuen/geaenderten Dateien

| Datei | Aktion |
|-------|--------|
| `supabase/functions/send-email/index.ts` | Neu |
| `supabase/config.toml` | Erweitert |
| `supabase/migrations/...` | Neue Migration (email_logs Tabelle + RLS) |
| `supabase/functions/submit-application/index.ts` | Erweitert |
| `supabase/functions/create-employee-account/index.ts` | Erweitert |
| `supabase/functions/sign-contract/index.ts` | Erweitert |
| `src/pages/admin/AdminBewerbungen.tsx` | Erweitert (E-Mail-Trigger + Ablehnen-Button) |
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | Erweitert |
| `src/pages/admin/AdminBewertungen.tsx` | Erweitert |
| `src/components/admin/AssignmentDialog.tsx` | Erweitert |
| `src/pages/admin/AdminEmails.tsx` | Neu |
| `src/components/admin/AdminSidebar.tsx` | Erweitert |
| `src/App.tsx` | Erweitert |
