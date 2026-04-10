

## Plan: Filter-Dropdown nach Auftragstyp für Anhänge und Bewertungen

### Änderungen

**Beide Seiten** bekommen ein `Select`-Dropdown neben der Suchleiste mit den Optionen: Alle / Bankdrop / Exchanger / Platzhalter / Andere.

### 1. `src/pages/admin/AdminAnhaenge.tsx`

- **Import**: `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` aus `@/components/ui/select`
- **State**: `const [orderTypeFilter, setOrderTypeFilter] = useState("all")`
- **Query anpassen**: In der `order_attachments`-Query zusätzlich `orders(title, required_attachments, order_type)` selektieren und `order_type` in die Gruppe speichern
- **Filter**: Nach dem Search-Filter zusätzlich nach `order_type` filtern wenn nicht "all"
- **UI**: Dropdown neben dem Suchfeld in einer Flex-Row

### 2. `src/pages/admin/AdminBewertungen.tsx`

- **Import**: `Select`-Komponenten
- **State**: `const [orderTypeFilter, setOrderTypeFilter] = useState("all")`
- **Query anpassen**: In der Orders-Query zusätzlich `order_type` selektieren und im `GroupedReview`-Interface + `orderMap` speichern, dann `order_type` in jede Gruppe übertragen
- **Filter**: Nach dem Search-Filter zusätzlich nach `order_type` filtern
- **UI**: Dropdown neben dem Suchfeld

### Dropdown-UI (identisch für beide Seiten)

```tsx
<Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Alle Typen" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Alle Typen</SelectItem>
    <SelectItem value="bankdrop">Bankdrop</SelectItem>
    <SelectItem value="exchanger">Exchanger</SelectItem>
    <SelectItem value="platzhalter">Platzhalter</SelectItem>
    <SelectItem value="andere">Andere</SelectItem>
  </SelectContent>
</Select>
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminAnhaenge.tsx` | order_type in Query + State + Filter + Dropdown |
| `src/pages/admin/AdminBewertungen.tsx` | order_type in Query/Interface + State + Filter + Dropdown |

