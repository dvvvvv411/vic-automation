
Ziel: In `/admin/arbeitsvertraege` sollen E-Mails immer kleingeschrieben angezeigt werden, und neue/aktualisierte E-Mails sollen dauerhaft in lowercase gespeichert werden.

1) Anzeige in `/admin/arbeitsvertraege` auf lowercase erzwingen  
- In `src/pages/admin/AdminArbeitsvertraege.tsx` eine kleine Helper-Funktion einbauen (`normalizeEmail(email)`), die `trim()` + `toLowerCase()` macht.  
- Diese Helper-Funktion an allen Anzeige-Stellen verwenden (Kartenliste + Detaildialog), egal ob E-Mail aus `employment_contracts.email` oder `applications.email` kommt.

2) Schreibpfade im Frontend normalisieren  
- `src/pages/Arbeitsvertrag.tsx`: bei RPC `submit_employment_contract` `_email` als `form.email.trim().toLowerCase()` senden.  
- `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`: gleiches für `_email`.  
- `src/pages/Auth.tsx`: beim initialen Insert in `employment_contracts` `email: regEmail.trim().toLowerCase()` speichern.

3) DB-seitige Absicherung („immer lowercase“, unabhängig vom Client)  
- SQL-Migration erstellen mit `BEFORE INSERT OR UPDATE` Trigger auf `public.employment_contracts` und `public.applications`, der `NEW.email := lower(trim(NEW.email))` setzt (falls nicht null).  
- Dadurch werden auch zukünftige Schreibpfade (z. B. andere Seiten/Functions) automatisch korrekt normalisiert.

4) Bestehende Daten einmalig bereinigen  
- Einmaliges Daten-Update ausführen: vorhandene `employment_contracts.email` und `applications.email` auf `lower(trim(email))` setzen (nur non-null, nur wenn sich Wert ändert).  
- So sind alte Mixed-Case-Einträge sofort sauber.

5) Kurztest (End-to-End)  
- Testfall mit gemischter Schreibweise (z. B. `Otto_Eggert@t-online.de`) durchspielen: Vertrag speichern/aktualisieren → in `/admin/arbeitsvertraege` prüfen, dass Anzeige lowercase ist.  
- Zusätzlich prüfen, dass nach Reload und bei neu angelegten Datensätzen weiterhin lowercase gespeichert bleibt.

Betroffene Dateien:
- `src/pages/admin/AdminArbeitsvertraege.tsx`
- `src/pages/Arbeitsvertrag.tsx`
- `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`
- `src/pages/Auth.tsx`
- `supabase/migrations/*` (neue Migration für Email-Normalisierung per Trigger)

Technische Details:
- Kein Rollen-/RLS-Umbau nötig.  
- Kein Schema-Redesign nötig; nur Trigger-Funktion + Trigger + Datenbereinigung.  
- Ergebnis: UI ist sofort konsistent, und Datenqualität bleibt dauerhaft stabil.
