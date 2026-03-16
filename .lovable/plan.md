

# Passwort-Management in der Mitarbeiter-Detailseite

## Änderungen

### 1. `src/pages/admin/AdminMitarbeiterDetail.tsx` — CredentialsCard umbauen

- Label "Temporäres Passwort" → "Passwort"
- `temp_password` wird zensiert angezeigt (••••••••), mit Auge-Button zum Aufdecken
- Neuer Button "Passwort zurücksetzen" öffnet einen Dialog
- **Reset-Dialog**:
  - Zeigt ein neu generiertes Passwort (nur Buchstaben + Zahlen, 8 Zeichen)
  - Button "Neu generieren" um ein anderes zu erzeugen
  - Button "Bestätigen" ruft die neue Edge Function auf
  - Nach Erfolg: `temp_password` im Contract wird aktualisiert, Dialog schließt, Card zeigt neues Passwort (zensiert)

### 2. Neue Edge Function `supabase/functions/reset-employee-password/index.ts`

- Empfängt `{ contract_id, new_password }`
- Verifiziert Caller ist Admin/Kunde
- Liest `user_id` aus `employment_contracts`
- Setzt Passwort via `adminClient.auth.admin.updateUserById(userId, { password })`
- Speichert `new_password` als `temp_password` in `employment_contracts`
- Gibt `{ success: true }` zurück

### 3. `supabase/config.toml` — JWT-Verifizierung deaktivieren

```toml
[functions.reset-employee-password]
verify_jwt = false
```

## Passwort-Generator

Nur `A-Z`, `a-z`, `0-9`, 8 Zeichen Länge. Funktion wird client-seitig im Dialog verwendet und der generierte Wert an die Edge Function geschickt.

