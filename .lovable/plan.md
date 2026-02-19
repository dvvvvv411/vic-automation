

# Neue Spalte "Anstellungsart" in Bewerbungsgespraeche

## Aenderung

In `src/pages/admin/AdminBewerbungsgespraeche.tsx` wird eine neue Spalte "Anstellungsart" hinzugefuegt, die den Wert `employment_type` aus der verknuepften `applications`-Tabelle anzeigt.

Die Daten sind bereits vorhanden -- die Query laedt `applications(first_name, last_name, email, phone, brandings(...))`, es muss nur `employment_type` ergaenzt werden.

## Technische Aenderungen

### `src/pages/admin/AdminBewerbungsgespraeche.tsx`

1. **Select-Query erweitern**: `employment_type` zum Select hinzufuegen:
   ```
   applications(first_name, last_name, email, phone, employment_type, brandings(id, company_name))
   ```

2. **TableHead hinzufuegen**: Neue Spalte "Anstellungsart" nach "Branding"

3. **TableCell hinzufuegen**: Zeigt `item.applications?.employment_type || "–"` an

| Datei | Aenderung |
|-------|----------|
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | Query + Spalte ergaenzen |

