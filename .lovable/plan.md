

## Plan: 4 Aenderungen

### 1. Mitarbeiter loeschen (Edge Function + AdminMitarbeiter.tsx)

Da der User auch aus Supabase Auth geloescht werden soll, brauchen wir eine Edge Function mit `service_role_key` — das geht nicht vom Client.

**Neue Edge Function `delete-employee/index.ts`:**
- Verifiziert dass der Aufrufer Admin ist (gleiche Logik wie create-caller-account)
- Empfaengt `contractId` im Body
- Laedt `user_id` aus `employment_contracts` fuer die gegebene contractId
- Loescht den `employment_contracts` Eintrag (CASCADE loescht zugehoerige Daten)
- Falls `user_id` vorhanden: loescht den Auth-User via `adminClient.auth.admin.deleteUser(userId)`
- Loescht auch `user_roles` und `profiles` fuer den User

**`supabase/config.toml`:** Eintrag `[functions.delete-employee]` mit `verify_jwt = false`

**`AdminMitarbeiter.tsx`:**
- Neuer Trash2-Button neben Sperren-Button
- AlertDialog Bestaetigung ("Mitarbeiter und Benutzerkonto endgueltig loeschen?")
- Ruft `supabase.functions.invoke("delete-employee", { body: { contractId } })` auf
- Query invalidieren nach Loeschung

### 2. Termine loeschen (3 Dateien)
- **AdminBewerbungsgespraeche.tsx**: Trash2-Button in Aktionen-Spalte, `interview_appointments` DELETE mit AlertDialog
- **AdminProbetag.tsx**: Trash2-Button, `trial_day_appointments` DELETE
- **AdminErsterArbeitstag.tsx**: Trash2-Button, `first_workday_appointments` DELETE

### 3. Caller-Typ "Probetag" auch Zugriff auf 1. Arbeitstag

**`create-caller-account/index.ts` (Zeile 91-95):**
- Bei `callerType === "probetag"` zwei `admin_permissions` Eintraege erstellen: `/admin/probetag` UND `/admin/erster-arbeitstag`

**`AdminCaller.tsx` (Zeile 56):**
- callerType-Erkennung anpassen: pruefen ob User `/admin/probetag` ODER `/admin/erster-arbeitstag` hat → dann "probetag"
- `typeLabel` (Zeile 146): "Probetage" → "Probetage & 1. Arbeitstag"

### 4. "Probetag erfolgreich" Email: Button zur /auth Seite

**`AdminProbetag.tsx` (Zeile 95-108):**
- `buildBrandingUrl` verwenden um korrekte Domain/Subdomain zu ermitteln
- `button_text: "Jetzt anmelden"` und `button_url` mit `/auth` URL an sendEmail uebergeben

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/delete-employee/index.ts` | Neue Edge Function |
| `supabase/config.toml` | Neuer Eintrag |
| `AdminMitarbeiter.tsx` | Loeschen-Button + Dialog |
| `AdminBewerbungsgespraeche.tsx` | Termin-Loeschen |
| `AdminProbetag.tsx` | Termin-Loeschen + Email-Button |
| `AdminErsterArbeitstag.tsx` | Termin-Loeschen |
| `create-caller-account/index.ts` | Zwei Permissions bei Probetag |
| `AdminCaller.tsx` | Badge-Label anpassen |

