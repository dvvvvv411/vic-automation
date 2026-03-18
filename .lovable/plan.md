# Datenisolierung: Branding-basiert (abgeschlossen)

## Was wurde gemacht

### DB-Migration
- `branding_id` zu 6 Tabellen hinzugefügt: `phone_numbers`, `orders`, `chat_templates`, `sms_spoof_templates`, `sms_spoof_logs`, `employment_contracts`
- `user_has_any_branding()` Security-Definer-Funktion erstellt
- Alle RLS-Policies für ~16 Tabellen auf Branding-basiert umgeschrieben
- Superadmin-Logik: Admins ohne Branding-Zuweisung sehen weiterhin alles
- `employment_contracts.branding_id` wird automatisch per Trigger aus `applications.branding_id` befüllt
- `contracts_for_branding_ids()` nutzt jetzt direkt `employment_contracts.branding_id`
- RLS-Policies für `employment_contracts` nutzen direkt `branding_id` statt `apps_for_branding_ids()`

### Frontend
- `useBrandingFilter` Hook erstellt (ersetzt `useUserQueryKey`)
- ~20 Admin-Seiten auf branding-basierte Query-Keys umgestellt
- Inserts für `orders` und `phone_numbers` senden jetzt `branding_id` mit
- `employment_contracts` Queries nutzen direkt `.eq("branding_id", ...)` statt `applications!inner(branding_id)` Join
- `AdminBewertungen` filtert Bewertungen über Mitarbeiter-Branding statt über Order-Branding

---

# Auftrags-Erstellung & Anhänge-System (abgeschlossen)

## Was wurde gemacht

### DB-Migration
- `orders` Tabelle erweitert: `description`, `order_type`, `estimated_hours`, `is_starter_job`, `work_steps` (jsonb), `required_attachments` (jsonb)
- `order_number` und `provider` auf nullable gesetzt
- Neue Tabelle `order_attachments` mit RLS-Policies (Mitarbeiter: eigene lesen/einfügen, Admins: lesen/updaten/löschen)
- Storage-Bucket `order-attachments` erstellt mit RLS-Policies

### Frontend - Admin
- 4-Schritt Auftragserstellungs-Wizard (`AdminAuftragWizard.tsx`): Grundinfos, Arbeitsschritte, Bewertungsfragen, Erforderliche Anhänge
- Routen: `/admin/auftraege/neu`, `/admin/auftraege/:id/bearbeiten`
- Auftrageliste (`AdminAuftraege.tsx`) komplett refactored: Dialog entfernt, Link zum Wizard
- Neue Seite `AdminAnhaenge.tsx` für Anhänge-Verwaltung (Genehmigen/Ablehnen)
- Sidebar: "Anhänge" Eintrag unter "Bewertungen" hinzugefügt

### Frontend - Mitarbeiter
- `AuftragDetails.tsx`: Arbeitsschritte-Anzeige, Anhänge-Upload mit Status-Tracking
- Bewertungs-Freischaltung (`review_unlocked`) komplett entfernt – Mitarbeiter können immer eigenständig bewerten
- Upload akzeptiert PNG, JPG, JPEG, PDF

### Frontend - AdminMitarbeiterDetail
- Aufträge-Tab zeigt jetzt "Anhänge ausstehend" Badge wenn erforderliche Anhänge noch nicht genehmigt sind

---

# Vergütungsmodell pro Branding (abgeschlossen)

## Was wurde gemacht

### DB-Migration
- `payment_model` (text, default 'per_order'), `salary_minijob`, `salary_teilzeit`, `salary_vollzeit` (numeric, nullable) auf `brandings` hinzugefügt

### Frontend - Admin
- `AdminBrandings.tsx`: RadioGroup für Vergütungsmodell (pro Auftrag / Festgehalt) + bedingte Gehaltsfelder für Minijob/Teilzeit/Vollzeit
- `AdminAuftragWizard.tsx`: Vergütungsfeld wird bei Festgehalt-Branding ausgeblendet, reward wird automatisch auf "0" gesetzt

### Frontend - Mitarbeiter
- `MitarbeiterLayout.tsx`: Branding-Daten um payment_model und Gehaltsspalten erweitert
- `MitarbeiterDashboard.tsx`: Stats-Grid zeigt "Festgehalt" statt "Guthaben" bei fixed_salary; Prämie-Zeile in Auftrags-Cards ausgeblendet
- `DashboardPayoutSummary.tsx`: Zeigt Festgehalt statt Balance bei fixed_salary
- `AuftragDetails.tsx`: Prämie-Anzeige ausgeblendet bei fixed_salary

---

# Automatische SMS-Erinnerungen 24h vor Terminen (abgeschlossen)

## Was wurde gemacht

### DB-Migration
- `reminder_sent` (boolean, default false) auf `interview_appointments` und `trial_day_appointments`
- `pg_cron` und `pg_net` Extensions aktiviert

### DB-Daten
- Zwei neue SMS-Templates: `gespraech_erinnerung_auto`, `probetag_erinnerung_auto`
- Stündlicher Cron-Job `appointment-reminders-hourly` eingerichtet

### Edge Function
- `send-appointment-reminders`: Prüft stündlich Termine in den nächsten 24-25h, sendet Erinnerungs-SMS via `send-sms`, markiert `reminder_sent = true`
- SMS wird mit korrekter `branding_id` und `event_type` geloggt → erscheint in SMS-History

### Frontend
- `AdminSmsTemplates.tsx`: Platzhalter für `gespraech_erinnerung_auto` und `probetag_erinnerung_auto` registriert

---

# Stundenlohn-Untermodell für Festgehalt-Brandings (abgeschlossen)

## Was wurde gemacht

### DB-Migration
- `hourly_rate_enabled` (boolean, default false), `hourly_rate_minijob`, `hourly_rate_teilzeit`, `hourly_rate_vollzeit` (numeric, nullable) auf `brandings` hinzugefügt

### Frontend - Admin
- `AdminBrandingForm.tsx`: Bei Festgehalt neue Unterauswahl (RadioGroup) zwischen "Festgehalt" und "Stundenlohn"
- Bei Stundenlohn: Drei Felder für Stundensatz pro Anstellungsart (€/Std.)
- Schema und initialForm um neue Felder erweitert

### Frontend - Mitarbeiter
- `MitarbeiterLayout.tsx`: Branding-Query und Interface um hourly_rate-Felder erweitert
- `MitarbeiterDashboard.tsx`: Bei Stundenlohn-Modell wird Verdienst aus erfolgreichen Aufträgen berechnet (estimated_hours × Stundensatz)
- `DashboardPayoutSummary.tsx`: Zeigt berechneten Stundenlohn-Verdienst statt Festgehalt
- `MeineDaten.tsx`: Statistik-Card zeigt "Verdienst" statt "Festgehalt"; Verdienst-Historie wird bei Stundenlohn eingeblendet mit Spalten Auftrag/Stunden/Verdienst/Datum
- `MitarbeiterAuftraege.tsx`: Bei erfolgreich abgeschlossenen Aufträgen wird der berechnete Verdienst (Stunden × Stundensatz) angezeigt

### Logik
- Ein Auftrag zählt nur als "erfolgreich" wenn Bewertung + ggf. Anhänge genehmigt (bestehender Status `erfolgreich`)
- Stunden werden aus `orders.estimated_hours` entnommen

---

# Externe Bewerbung — Toggle, Mass Import & Badge (abgeschlossen)

## Was wurde gemacht

### DB-Migration
- `is_external` (boolean, default false) auf `applications` hinzugefügt

### Frontend - AdminBewerbungen.tsx
- Neuer Toggle "Externe Bewerbung" unter Indeed-Toggle, exklusiv zueinander
- Bei Extern: gleiche reduzierte Felder wie Indeed (Vorname, Nachname, Email, Telefon, Branding)
- Mass Import bei Extern verfügbar mit gleichem Format wie Indeed
- Submit-Logik: `is_external: true, is_indeed: false` bei Extern
- Accept-Logik: Externe Bewerbungen nutzen normale SMS (nicht Spoof), da `is_indeed === false`
- Badge "Extern" in der Tabelle neben Indeed-Badge
- "–" nur wenn weder Indeed noch Extern noch CV
