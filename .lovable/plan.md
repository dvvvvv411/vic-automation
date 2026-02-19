
# Fix: Ungültige Arbeitsvertrag-Links

## Problem

Die Seite `/arbeitsvertrag/:id` erwartet eine **Application-ID** als URL-Parameter (sie sucht in der `applications`-Tabelle nach dieser ID). Aber in `AdminBewerbungsgespraeche.tsx` wird beim Markieren eines Gesprächs als "erfolgreich" die **Contract-ID** in den Link eingesetzt. Dadurch findet die Seite keinen passenden Eintrag und zeigt "Ungültiger Link".

Konkretes Beispiel:
- URL: `/arbeitsvertrag/16fe174d-...` (= Contract-ID)
- Die Seite sucht nach `applications.id = 16fe174d-...` -> nicht gefunden
- Korrekt wäre: `/arbeitsvertrag/1ba66aaa-...` (= Application-ID)

## Änderung

### `src/pages/admin/AdminBewerbungsgespraeche.tsx`

Zeile 113 ändern: `contract.id` durch `item.application_id` ersetzen.

```
// Vorher:
const contractLink = contract
  ? await buildBrandingUrl(app.brandings?.id, `/arbeitsvertrag/${contract.id}`)
  : null;

// Nachher:
const contractLink = contract
  ? await buildBrandingUrl(app.brandings?.id, `/arbeitsvertrag/${item.application_id}`)
  : null;
```

| Datei | Änderung |
|-------|----------|
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | `contract.id` -> `item.application_id` im Link |
