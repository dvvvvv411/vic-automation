

## Plan: SMS History — Alle Einträge laden (über 1000er Limit)

### Problem

Supabase limitiert Queries auf 1000 Rows. Die `sms_logs` und `sms_spoof_logs` Queries in `AdminSmsHistory.tsx` (Zeile 96-106 und 112-122) holen nur eine einzelne Page — Statistik-Cards zeigen maximal 1000.

### Fix

**Datei:** `src/pages/admin/AdminSmsHistory.tsx`

Eine Helper-Funktion `fetchAllRows` einbauen, die in 1000er-Batches mit `.range(from, to)` paginiert bis keine weiteren Rows kommen. Beide queryFn's (smsLogs + spoofLogs) nutzen diesen Helper statt des einfachen `.select()`.

```typescript
async function fetchAllRows(query: any) {
  const PAGE = 1000;
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await query.range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
```

Problem: Supabase-Query-Builder ist nicht wiederverwendbar nach `.range()`. Deshalb muss die Query-Erstellung als Funktion übergeben werden, die bei jedem Batch neu aufgerufen wird:

```typescript
async function fetchAllRows(buildQuery: () => any) {
  const PAGE = 1000;
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await buildQuery().range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
```

Beide queryFn's übergeben eine Builder-Funktion statt direkt `.select()` auszuführen.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminSmsHistory.tsx` | `fetchAllRows` Helper + beide Queries umstellen |

