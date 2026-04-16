

## Plan: Passwort ändern + E-Mail-Anzeige fix

### Beobachtung
- E-Mail-Anzeige: Code zeigt bereits `profile?.email || display_name || full_name`. Wenn bei Steffi ein Name angezeigt wird, hat das Profil eine leere `email`-Spalte und fällt auf `display_name`/`full_name` zurück. Lösung: E-Mail aus `auth.users` (über Edge Function) als Quelle nehmen, statt auf `profiles.email` zu vertrauen.
- Passwort ändern: Es gibt bereits `reset-employee-password` Edge Function — wir bauen analog `reset-kunde-password` (admin-only, Service-Role).

### Änderungen

**1. Neue Edge Function `reset-kunde-password`**
- Admin-Check (wie in `create-kunde-account`)
- Verifiziert dass Ziel-User Rolle `kunde` hat
- `adminClient.auth.admin.updateUserById(userId, { password })`

**2. Neue Edge Function `list-kunden` (oder Erweiterung)**
- Admin-Check
- Liefert für alle `kunde`-User die echte Auth-E-Mail aus `auth.users` zurück
- Damit wird Steffis E-Mail garantiert angezeigt

**3. `src/pages/admin/AdminKunden.tsx`**
- Query nutzt neue Edge Function statt direktem `profiles`-Lookup → echte E-Mail garantiert
- Neuer Button "Passwort ändern" pro Kunde (Key-Icon) öffnet kleinen Dialog mit Passwort-Feld + Speichern
- Mutation ruft `reset-kunde-password` auf

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `supabase/functions/reset-kunde-password/index.ts` | NEU — Passwort-Reset für Kunden |
| `supabase/functions/list-kunden/index.ts` | NEU — liefert Kunden mit echter Auth-E-Mail |
| `supabase/config.toml` | Beide Functions registrieren (`verify_jwt = true`) |
| `src/pages/admin/AdminKunden.tsx` | Query auf neue Function umstellen + Passwort-Dialog/Button hinzufügen |

### Sicherheit
- Beide Functions: nur Admins (über `user_roles`-Check mit Service-Role-Client)
- Passwort-Reset prüft, dass Ziel-User tatsächlich Rolle `kunde` hat — keine Möglichkeit andere Rollen zu beeinflussen

