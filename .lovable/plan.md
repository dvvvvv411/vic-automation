
Problem:
Der Fehler ist kein Resend-Setup-Problem, sondern ein falscher Branding-Lookup.

Was ich geprüft habe:
- Der letzte fehlgeschlagene `auftrag_zugewiesen`-Mailversand hat in `email_logs` `branding_id = null`.
- Der gleiche Vertrag (`98d8534a-2b62-4fdd-82d0-91a656eee80a`) hat aber:
  - in `employment_contracts.branding_id` bereits `cbb67ac3-f444-4f68-b5af-aee65d24068c`
  - im zugehörigen `profiles.branding_id` ebenfalls `cbb67ac3-f444-4f68-b5af-aee65d24068c`
- `application_id` ist dort `null` (Selbstregistrierung), deshalb liefert der aktuelle Zugriff über `applications(branding_id)` nichts.
- Das Branding selbst hat gültige Resend-Daten.

Warum es gerade kaputt ist:
- In `src/components/admin/AssignmentDialog.tsx` wird für neue Zuweisungen aktuell `applications(branding_id)` gelesen.
- Bei Self-Registered Mitarbeitern ohne `application_id` ist das leer.
- Dadurch wird `send-email` ohne `branding_id` aufgerufen und die Edge Function findet kein `brandings.resend_api_key`.
- Dasselbe führt dort auch zu `sms_logs.branding_id = null`, also kaputten Branding-Statistiken.

Plan:
1. Branding-Auflösung auf die richtige Reihenfolge umstellen
   - Primär: `profiles.branding_id`
   - Fallback: `employment_contracts.branding_id`
   - Nicht mehr auf `applications.branding_id` verlassen, wenn es um Mitarbeiter/Verträge geht.

2. `AssignmentDialog.tsx` gezielt umbauen
   - Beim Laden der neu zugewiesenen Verträge zusätzlich `user_id` und `branding_id` aus `employment_contracts` holen.
   - In einem zweiten Query die zugehörigen `profiles` für diese `user_id`s laden.
   - Pro Mitarbeiter eine `effectiveBrandingId` berechnen:
     `profile.branding_id ?? contract.branding_id ?? null`
   - Diese `effectiveBrandingId` für:
     - `sendEmail(...)`
     - `sendSms(...)`
     - `buildBrandingUrl(...)`
     - Sendername-Lookup aus `brandings`
     verwenden.

3. Gleiche Bug-Klasse an den weiteren Stellen mitziehen
   - Die gleichen Muster existieren auch in Admin-Flows wie:
     - `src/pages/admin/AdminBewertungen.tsx`
     - `src/pages/admin/AdminLivechat.tsx`
     - `src/pages/admin/AdminMitarbeiterDetail.tsx`
   - Dort ersetze ich ebenfalls die Ableitung über `applications.branding_id` durch dieselbe Logik, damit nicht an anderer Stelle wieder `branding_id = null` in Mail/SMS/Stats landet.

4. Edge Function zusätzlich absichern
   - `supabase/functions/send-email/index.ts` bekommt einen Safety-Net-Fallback:
     Wenn `branding_id` fehlt, aber `metadata.contract_id` vorhanden ist, löst die Function serverseitig das Branding nach derselben Reihenfolge auf:
     `profiles.branding_id` zuerst, dann `employment_contracts.branding_id`.
   - So scheitert der Versand nicht sofort, falls ein Client-Call später wieder ohne Branding kommt.

5. Erwartetes Ergebnis nach dem Fix
   - `send-email` nutzt das richtige Branding und damit die richtige Resend-Konfiguration.
   - `email_logs.branding_id` ist korrekt gesetzt.
   - `sms_logs.branding_id` ist im gleichen Flow ebenfalls korrekt gesetzt.
   - Branding-Statistiken und History stimmen wieder.
   - Self-Registered Mitarbeiter funktionieren genauso zuverlässig wie Bewerber mit `application_id`.

Betroffene Dateien:
- `src/components/admin/AssignmentDialog.tsx`
- `src/pages/admin/AdminBewertungen.tsx`
- `src/pages/admin/AdminLivechat.tsx`
- `src/pages/admin/AdminMitarbeiterDetail.tsx`
- `supabase/functions/send-email/index.ts`

Technische Notiz:
Es ist sinnvoll, dafür eine kleine gemeinsame Helper-Logik einzuführen, statt den Lookup an mehreren Stellen leicht unterschiedlich zu duplizieren. So bleibt die Regel dauerhaft konsistent:
`profiles.branding_id` ist die primäre Quelle, `employment_contracts.branding_id` der Fallback.
