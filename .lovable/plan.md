

# Mitarbeiter-System: Benutzerkonto-Erstellung bei Genehmigung

## Uebersicht

Wenn ein Admin einen Arbeitsvertrag genehmigt, wird automatisch ein Benutzerkonto fuer den Bewerber erstellt. Dazu kommt ein neuer Admin-Reiter "Mitarbeiter" mit Tabellenuebersicht.

## 1. Datenbank-Aenderungen

Neue Spalten in `employment_contracts`:
- `user_id` (uuid, nullable) -- Referenz zum erstellten Auth-User
- `temp_password` (text, nullable) -- Das generierte 6-stellige Passwort

## 2. Edge Function: `create-employee-account`

Da ein neuer Auth-User nur mit dem Service Role Key erstellt werden kann (nicht mit dem Anon Key), wird eine Edge Function benoetigt:

- Empfaengt `contract_id` als Parameter
- Liest die Vertragsdaten (E-Mail, Name) aus `employment_contracts`
- Generiert ein 6-stelliges Passwort (Buchstaben + Zahlen)
- Erstellt den User via `supabase.auth.admin.createUser()` (mit `email_confirm: true` damit kein Bestaetigungslink noetig ist)
- Fuegt die Rolle "user" in `user_roles` ein
- Speichert `user_id` und `temp_password` in `employment_contracts`
- Setzt den Status auf "genehmigt"
- Gibt das Passwort zurueck

Wichtig: Der Admin bleibt in seinem eigenen Account eingeloggt, da die User-Erstellung serverseitig in der Edge Function passiert.

## 3. Frontend: Genehmigungsprozess anpassen

In `AdminArbeitsvertraege.tsx`:
- `handleApprove` ruft statt `supabase.rpc("approve_employment_contract")` die neue Edge Function auf
- Nach Erfolg wird eine Erfolgsmeldung mit dem generierten Passwort angezeigt

## 4. Neuer Admin-Reiter: Mitarbeiter

### Sidebar (`AdminSidebar.tsx`)
- Neuer Eintrag "Mitarbeiter" mit Icon `Users` und URL `/admin/mitarbeiter`

### Route (`App.tsx`)
- Neue Route `/admin/mitarbeiter` -> `AdminMitarbeiter`

### Neue Seite: `src/pages/admin/AdminMitarbeiter.tsx`
- Query: Alle `employment_contracts` mit `status = 'genehmigt'` joinen mit `applications` (fuer Name, Telefon, Email, Branding)
- Tabellenspalten: Name, Telefon, E-Mail, Passwort, Branding, Status
- Status-Badge: "Nicht unterzeichnet" (fuer alle genehmigten Vertraege)
- Pagination wie bei den anderen Admin-Tabellen

## Technische Details

| Datei | Aenderung |
|---|---|
| Migration | `ALTER TABLE employment_contracts ADD COLUMN user_id uuid, ADD COLUMN temp_password text` |
| `supabase/functions/create-employee-account/index.ts` | Neue Edge Function fuer User-Erstellung |
| `src/pages/admin/AdminArbeitsvertraege.tsx` | `handleApprove` ruft Edge Function statt RPC |
| `src/pages/admin/AdminMitarbeiter.tsx` | Neue Seite mit Mitarbeiter-Tabelle |
| `src/App.tsx` | Neue Route `/admin/mitarbeiter` |
| `src/components/admin/AdminSidebar.tsx` | Neuer Nav-Eintrag "Mitarbeiter" |

