
## Plan: Passwort-Änderung für Caller-Accounts

Auf der Seite `/admin/caller` wird genau die gleiche "Passwort ändern"-Funktion ergänzt, die es bei `/admin/kunden` schon gibt.

### Änderungen

1. **Neue Edge Function `reset-caller-password`**
   - 1:1 nach Vorbild von `reset-kunde-password`
   - Prüft, dass der aufrufende User Admin ist
   - Prüft, dass der Ziel-User die Rolle `caller` hat (statt `kunde`)
   - Setzt das neue Passwort über `auth.admin.updateUserById`
   - Eintrag in `supabase/config.toml` mit `verify_jwt = false` (gleiches Muster wie alle anderen Funktionen im Projekt)

2. **UI-Erweiterung in `src/pages/admin/AdminCaller.tsx`**
   - Neuer Schlüssel-Icon-Button (`KeyRound` aus lucide-react) in der Action-Leiste jeder Caller-Zeile, zwischen Settings und Trash
   - Tooltip "Passwort ändern"
   - Klick öffnet einen Dialog mit:
     - Anzeige der Caller-E-Mail/des Namens
     - Eingabefeld "Neues Passwort" (min. 6 Zeichen)
     - Speichern-Button
   - Mutation ruft `reset-caller-password` per `supabase.functions.invoke` auf
   - Success-Toast "Passwort geändert", Fehler-Toast bei Problemen

Keine Datenbank-Migration nötig (rein Edge Function + Frontend).
