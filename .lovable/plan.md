

## Problem: Supabase 1000-Zeilen-Limit

Es gibt **1167 Reviews** für dieses Branding, aber Supabase gibt standardmäßig maximal **1000 Zeilen** pro Query zurück. Die Reviews für den DKB-Auftrag werden abgeschnitten und deshalb nicht angezeigt.

Betroffen sind zwei Queries in `AdminBewertungen.tsx`:
1. `order_reviews` Query (Zeile 89-92) — 1167 Zeilen, Limit 1000
2. `order_assignments` Query (Zeile 100) — potenziell auch betroffen

### Lösung

In `src/pages/admin/AdminBewertungen.tsx` beide betroffene Queries mit einer Batch-Funktion paginieren, die alle Ergebnisse über mehrere Requests in 1000er-Blöcken abruft.

**Konkret:**

1. Helper-Funktion `fetchAll` erstellen, die eine Supabase-Query in 1000er-Schritten mit `.range()` abruft bis keine weiteren Daten kommen
2. Die `order_reviews`-Query (Zeile 89-92) durch `fetchAll` ersetzen
3. Die `order_assignments`-Query (Zeile 100) ebenfalls durch `fetchAll` ersetzen

```typescript
// Helper zum paginierten Abruf
async function fetchAll<T>(query: any): Promise<T[]> {
  const PAGE = 1000;
  let all: T[] = [];
  let from = 0;
  while (true) {
    const { data } = await query.range(from, from + PAGE - 1);
    if (!data?.length) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
```

Das Problem: `.range()` kann nicht auf eine bereits gebaute Query angewandt werden, weil man die Query-Builder-Kette nicht klonen kann. Stattdessen wird die Query-Logik in eine Schleife umgebaut, die `.range(from, to)` an die bestehende Query anhängt.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminBewertungen.tsx` | Paginierte Abfrage für `order_reviews` und `order_assignments` |

