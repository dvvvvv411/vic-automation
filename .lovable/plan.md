

# Telefonnummer bearbeitbar machen und auf Bestaetigungsseite anzeigen

## Aenderungen

### 1. Telefonnummer editierbar auf der Buchungsseite

Neben der angezeigten Telefonnummer wird ein kleines Bearbeiten-Icon (Pencil) eingefuegt. Beim Klick oeffnet sich ein Inline-Edit-Modus: Das Textfeld wird zu einem Input-Feld, in dem der Bewerber seine Nummer aendern kann. Ein Haekchen-Button speichert die Aenderung direkt in die `applications`-Tabelle via Supabase Update (ueber die RPC-Funktion oder direkt, da Anon aktuell SELECT hat -- hier brauchen wir eine neue RLS-Policy fuer UPDATE auf das `phone`-Feld).

### 2. Bestaetigungsseite: Telefonnummer im Hinweistext

Der Text "Bitte seien Sie zu diesem Zeitpunkt telefonisch erreichbar. Wir rufen Sie an." wird erweitert zu:
"Bitte seien Sie unter **{telefonnummer}** telefonisch erreichbar. Wir rufen Sie unter dieser Nummer an."

## Technische Details

### Neue RLS-Policy

Da anonyme Nutzer aktuell nur SELECT-Rechte auf `applications` haben, wird eine neue RLS-Policy benoetigt:

```sql
CREATE POLICY "Anon can update phone on applications"
ON public.applications
FOR UPDATE
USING (true)
WITH CHECK (true);
```

Um das Update moeglichst eingeschraenkt zu halten, wird stattdessen eine **Supabase Database Function** erstellt, die nur das `phone`-Feld eines bestimmten Datensatzes aktualisiert:

```sql
CREATE OR REPLACE FUNCTION public.update_application_phone(_application_id uuid, _phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.applications
  SET phone = _phone
  WHERE id = _application_id;
END;
$$;
```

So bleibt die RLS-Policy unberuehrt und nur das Telefon-Feld kann ueber diese Funktion geaendert werden -- sicher und gezielt.

### Aenderungen in `src/pages/Bewerbungsgespraech.tsx`

| Bereich | Aenderung |
|---|---|
| State | Neue States: `isEditingPhone`, `editedPhone` |
| Bewerber-Info | Phone-Anzeige wird zu einem Toggle zwischen Text + Pencil-Icon und Input + Check-Icon |
| Phone-Update | `supabase.rpc("update_application_phone", ...)` beim Speichern aufrufen, danach Query invalidieren |
| Bestaetigungsseite | Hinweistext anpassen: Telefonnummer dynamisch einfuegen mit Fettdruck |

### Keine neuen Abhaengigkeiten

Lucide-Icons `Pencil` und `Check` werden zusaetzlich importiert (bereits im Projekt verfuegbar).

