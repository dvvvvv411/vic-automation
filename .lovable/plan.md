

## Fix: Kunde kann keine Indeed-Bewerbung akzeptieren

### Ursache

In Zeile 216 von `AdminBewerbungen.tsx` wird `createShortLink()` aufgerufen, das einen Eintrag in die Tabelle `short_links` erstellt. Die RLS-Policy fuer INSERT auf `short_links` erlaubt aber nur `admin`:

```sql
has_role(auth.uid(), 'admin'::app_role)
```

Wenn ein Kunde-Account die Bewerbung akzeptiert, schlaegt der Insert fehl.

### Loesung

Die bestehende INSERT-Policy auf `short_links` erweitern, sodass auch `kunde`-Nutzer Eintraege erstellen koennen:

```sql
DROP POLICY "Admins can insert short_links" ON public.short_links;
CREATE POLICY "Admins and Kunden can insert short_links"
  ON public.short_links FOR INSERT
  TO public
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_kunde(auth.uid())
  );
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration | RLS-Policy auf `short_links` erweitern |

Keine Code-Aenderungen noetig — nur die Datenbank-Policy.

