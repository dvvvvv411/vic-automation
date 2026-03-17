

## Plan: RLS-Policy fuer Caller-Rollen hinzufuegen

### Problem

Die `user_roles` Tabelle hat keine RLS-Policy die es Admins erlaubt, Zeilen mit `role = 'caller'` zu lesen. Bestehende Policies:
- `Authenticated users can see admin roles` → nur `role = 'admin'`
- `Kunden can see kunde roles` → nur `role = 'kunde'`
- `Users can read own role` → nur eigene Zeile

Der Caller-Eintrag existiert in der DB, aber der Admin kann ihn nicht lesen.

### Fix

Eine neue RLS-Policy auf `user_roles` erstellen:

```sql
CREATE POLICY "Admins can see all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

Dies erlaubt Admins alle Rollen zu sehen, einschliesslich Caller-Rollen.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB Migration | Neue RLS-Policy auf `user_roles` |

