
# Fix: Branding wird nicht in der Mitarbeiter-Sidebar geladen

## Ursache

Die RLS-Policies auf den Tabellen `applications` und `brandings` erlauben SELECT nur fuer:
- **admin** (authentifiziert mit Admin-Rolle)
- **anon** (nicht eingeloggt)

Eingeloggte Mitarbeiter haben die Rolle `authenticated` und werden von keiner SELECT-Policy abgedeckt. Beide Queries in `MitarbeiterLayout.tsx` (Zeilen 45-49 und 53-57) geben daher leere Ergebnisse zurueck.

## Loesung

Zwei neue RLS-Policies erstellen:

### 1. `applications` - Mitarbeiter darf eigene Bewerbung lesen

```sql
CREATE POLICY "Users can read own application"
ON public.applications
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT application_id FROM employment_contracts
    WHERE user_id = auth.uid()
  )
);
```

Der Mitarbeiter kann nur die Bewerbung lesen, die mit seinem eigenen Arbeitsvertrag verknuepft ist.

### 2. `brandings` - Mitarbeiter darf zugewiesenes Branding lesen

```sql
CREATE POLICY "Users can read assigned branding"
ON public.brandings
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT a.branding_id FROM applications a
    JOIN employment_contracts ec ON ec.application_id = a.id
    WHERE ec.user_id = auth.uid()
  )
);
```

Der Mitarbeiter kann nur das Branding lesen, das ueber seine Bewerbung zugeordnet ist.

### Keine Code-Aenderungen noetig

Der Code in `MitarbeiterLayout.tsx` ist korrekt. Sobald die RLS-Policies greifen, wird das Branding (Logo + Firmenname) automatisch korrekt in der Sidebar angezeigt.
