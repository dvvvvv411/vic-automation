

## Plan: Probetag-Link kopieren Button bei Bewerbungsgespraeche

### Aenderung

**`src/pages/admin/AdminBewerbungsgespraeche.tsx`**

1. `Copy` Icon importieren (aus `lucide-react`)
2. In der Aktionen-Spalte einen neuen Button hinzufuegen (neben dem RefreshCw-Button), der nur bei `status === "erfolgreich"` erscheint
3. Bei Klick wird `buildBrandingUrl(app.brandings?.id, `/probetag/${item.application_id}`)` aufgerufen und das Ergebnis in die Zwischenablage kopiert mit `navigator.clipboard.writeText()` + Toast-Bestaetigung

### Technische Details

- Import `Copy` aus `lucide-react` (Zeile 17)
- Neuer Button direkt nach dem RefreshCw-Block (nach Zeile 463), innerhalb des `item.status === "erfolgreich"` Bereichs:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
  onClick={async () => {
    const link = await buildBrandingUrl(item.applications?.brandings?.id, `/probetag/${item.application_id}`);
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Probetag-Link kopiert!");
    } else {
      toast.error("Link konnte nicht erstellt werden");
    }
  }}
  title="Probetag-Link kopieren"
>
  <Copy className="h-4 w-4" />
</Button>
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminBewerbungsgespraeche.tsx` | Copy-Icon Import + neuer Button in Aktionen-Spalte |

