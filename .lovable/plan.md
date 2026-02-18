

# SMS-Benachrichtigungen via seven.io

## Übersicht

Integration von SMS-Benachrichtigungen ueber die seven.io REST API mit drei Bausteinen:
1. Automatische SMS bei 6 Ereignissen
2. Manueller SMS-Button im Admin-Livechat
3. Neue Admin-Seite `/admin/sms` zum Bearbeiten der SMS-Vorlagen und Testen

## Voraussetzung

Ein seven.io API-Key muss als Supabase Secret `SEVEN_API_KEY` hinterlegt werden.

---

## Datenbank-Aenderungen

### Neue Tabelle: `sms_templates`

| Spalte | Typ | Default |
|--------|-----|---------|
| id | uuid | gen_random_uuid() |
| event_type | text (unique, not null) | -- |
| label | text (not null) | -- |
| message | text (not null) | -- |
| updated_at | timestamptz | now() |

RLS: Nur Admins koennen SELECT, UPDATE, INSERT, DELETE.

Wird initial mit 6 Vorlagen befuellt (Platzhalter: `{name}`, `{auftrag}`, `{datum}`, `{uhrzeit}`, `{praemie}`, `{link}`):

| event_type | label | Standard-Text |
|------------|-------|---------------|
| bewerbung_angenommen | Bewerbung angenommen | Hallo {name}, Ihre Bewerbung wurde angenommen! Bitte buchen Sie Ihren Termin: {link} |
| vertrag_genehmigt | Vertrag genehmigt | Hallo {name}, Ihr Arbeitsvertrag wurde genehmigt. Loggen Sie sich ein: {link} |
| auftrag_zugewiesen | Neuer Auftrag | Hallo {name}, Ihnen wurde ein neuer Auftrag zugewiesen: {auftrag}. Details im Mitarbeiterportal. |
| termin_gebucht | Termin gebucht | Hallo {name}, Ihr Termin am {datum} um {uhrzeit} Uhr wurde bestaetigt. |
| bewertung_genehmigt | Bewertung genehmigt | Hallo {name}, Ihre Bewertung fuer "{auftrag}" wurde genehmigt. Praemie: {praemie}. |
| bewertung_abgelehnt | Bewertung abgelehnt | Hallo {name}, Ihre Bewertung fuer "{auftrag}" wurde leider abgelehnt. Bitte erneut bewerten. |

### Neue Tabelle: `sms_logs`

| Spalte | Typ | Default |
|--------|-----|---------|
| id | uuid | gen_random_uuid() |
| created_at | timestamptz | now() |
| recipient_phone | text (not null) | -- |
| recipient_name | text (nullable) | -- |
| message | text (not null) | -- |
| event_type | text (not null) | -- |
| status | text (not null) | 'sent' |
| error_message | text (nullable) | -- |

RLS: Nur Admins koennen SELECT.

---

## Neue Edge Function: `send-sms`

**Datei:** `supabase/functions/send-sms/index.ts`

- Empfaengt JSON: `{ to, text, event_type?, recipient_name? }`
- Sendet via `POST https://gateway.seven.io/api/sms` mit Header `X-Api-Key`
- Loggt Ergebnis in `sms_logs` (mit Service Role Key)
- CORS-Headers, `verify_jwt = false` in config.toml

---

## Client-Hilfsfunktion

**Neue Datei:** `src/lib/sendSms.ts`

Analog zu `sendEmail.ts` -- ruft `supabase.functions.invoke("send-sms", { body })` auf. Schlaegt still fehl (console.error), damit der Hauptprozess nicht blockiert wird.

---

## Automatische SMS bei 6 Ereignissen

An den Stellen, wo `sendEmail()` aufgerufen wird, wird zusaetzlich die SMS-Vorlage aus `sms_templates` geladen, Platzhalter ersetzt und `sendSms()` aufgerufen -- nur wenn eine Telefonnummer vorhanden ist.

| Ereignis | Datei | Aenderung |
|----------|-------|-----------|
| Bewerbung angenommen | `AdminBewerbungen.tsx` | Nach `sendEmail()` in `acceptMutation`: SMS-Template laden, Platzhalter ersetzen, `sendSms()` aufrufen |
| Vertrag genehmigt | `create-employee-account/index.ts` | Nach Email-Versand: SMS via seven.io direkt aus der Edge Function senden (Template aus DB laden) |
| Neuer Auftrag | `AssignmentDialog.tsx` | Nach `sendEmail()` in `saveMutation`: SMS an neue Mitarbeiter senden |
| Termin gebucht | `AuftragDetails.tsx` | Nach `sendEmail()` in `handleBookAppointment`: SMS senden |
| Bewertung genehmigt | `AdminBewertungen.tsx` | Nach `sendEmail()` in `handleApprove`: SMS senden |
| Bewertung abgelehnt | `AdminBewertungen.tsx` | Nach `sendEmail()` in `handleReject`: SMS senden |

---

## Manueller SMS-Button im Livechat

**Datei:** `src/pages/admin/AdminLivechat.tsx`

- Neues `Smartphone`-Icon im Chat-Header (zwischen TemplateManager und Admin-Profil)
- Klick oeffnet einen Dialog:
  - Anzeige der Telefonnummer (aus `employment_contracts.phone` -- wird beim Laden der Contract-Daten mitgeladen)
  - Textarea fuer freien SMS-Text
  - "SMS senden"-Button
- Ruft `sendSms()` auf mit `event_type: "manuell"`
- Toast bei Erfolg/Fehler

---

## Neue Admin-Seite: SMS-Vorlagen

**Neue Datei:** `src/pages/admin/AdminSmsTemplates.tsx`

- Route: `/admin/sms`
- Laedt alle SMS-Templates aus `sms_templates`-Tabelle
- Zeigt jedes Template als editierbare Karte:
  - Label (nicht editierbar)
  - Textarea fuer den SMS-Text
  - Hinweis zu verfuegbaren Platzhaltern
  - Zeichenzaehler
  - Speichern-Button pro Template
- **Test-SMS-Bereich** oben auf der Seite:
  - Input fuer Telefonnummer
  - Textarea fuer individuellen Text
  - "Test-SMS senden"-Button
  - Ruft `sendSms()` direkt auf mit `event_type: "test"`

### Sidebar

**Datei:** `src/components/admin/AdminSidebar.tsx`

- Neuer Eintrag "SMS" in der Gruppe "Einstellungen" (unter "E-Mails")
- Icon: `Smartphone` aus lucide-react
- URL: `/admin/sms`

### Routing

**Datei:** `src/App.tsx`

- Import + neue Route: `<Route path="sms" element={<AdminSmsTemplates />} />`

---

## Zusammenfassung aller Datei-Aenderungen

| Datei | Aenderung |
|-------|-----------|
| Migration | 2 neue Tabellen + RLS + Seed-Daten |
| `supabase/functions/send-sms/index.ts` | Neue Edge Function |
| `supabase/config.toml` | + send-sms Eintrag |
| `src/lib/sendSms.ts` | Neue Client-Hilfsfunktion |
| `src/pages/admin/AdminSmsTemplates.tsx` | Neue Seite (Vorlagen + Test-SMS) |
| `src/components/admin/AdminSidebar.tsx` | + SMS-Menueeintrag |
| `src/App.tsx` | + Route /admin/sms |
| `src/pages/admin/AdminBewerbungen.tsx` | + sendSms bei Annahme |
| `src/components/admin/AssignmentDialog.tsx` | + sendSms bei Zuweisung |
| `src/pages/admin/AdminBewertungen.tsx` | + sendSms bei Genehmigung/Ablehnung |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | + sendSms bei Terminbuchung |
| `supabase/functions/create-employee-account/index.ts` | + SMS bei Vertragsgenehmigung |
| `src/pages/admin/AdminLivechat.tsx` | + SMS-Dialog-Button |

