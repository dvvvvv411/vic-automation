

# Bugfix: Mitarbeiter kann Vertrag nicht sehen / Unterschrift wird übersprungen

## Ursache

Die letzte Migration hat die `employment_contracts` RLS-Policy `"Anon can select employment_contracts"` (die auf `{public}` = alle Rollen galt) entfernt und durch eine `anon`-only Policy ersetzt. Dadurch können authentifizierte User mit Rolle `user` (Mitarbeiter) ihren eigenen Vertrag nicht mehr lesen.

Das `MitarbeiterLayout` fragt `.from("employment_contracts").select(...).eq("user_id", user.id)` ab → bekommt `null` zurück → zeigt weder die Unterschrifts-Ansicht noch den Vertrag an → der Mitarbeiter landet direkt im Dashboard.

## Lösung

Eine neue RLS-Policy hinzufügen, die Mitarbeitern erlaubt ihren eigenen Vertrag zu lesen und zu aktualisieren:

```sql
-- Mitarbeiter können eigenen Vertrag lesen
CREATE POLICY "Users can select own employment_contract"
ON public.employment_contracts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Mitarbeiter können eigenen Vertrag aktualisieren (für Unterschrift etc.)
CREATE POLICY "Users can update own employment_contract"
ON public.employment_contracts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
```

## Dateien

| Datei | Änderung |
|-------|----------|
| Migration (SQL) | 2 neue RLS-Policies für `employment_contracts` |

Keine Code-Änderungen nötig — das Frontend funktioniert bereits korrekt, es fehlt nur der Datenbankzugriff.

