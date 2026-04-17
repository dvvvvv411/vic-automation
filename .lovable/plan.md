

## Plan: Indeed-Bewerber wieder vollständig anzeigen

### Ursache (per DB verifiziert)
Branding hat 1077 Bewerbungen total, davon 120 Indeed. Die Query auf `/admin/bewerbungen` lädt aber nur 1000 Zeilen (Supabase-Standardlimit). Da nach `created_at DESC` sortiert wird, fehlen die ältesten 77 — darunter ~76 Indeed-Bewerber. Resultat: nur ~44 Indeed sichtbar statt 120.

### Sichere, minimale Lösung

**Datei: `src/pages/admin/AdminBewerbungen.tsx`** — nur die `applications`-`queryFn` wird durch eine Batch-Loop ersetzt:

```ts
const BATCH = 1000;
let all: any[] = [];
let from = 0;
while (true) {
  const { data, error } = await supabase
    .from("applications")
    .select("*, brandings(...), interview_appointments(...)")
    .eq("branding_id", activeBrandingId!)
    .order("created_at", { ascending: false })
    .range(from, from + BATCH - 1);
  if (error) throw error;
  if (!data?.length) break;
  all = all.concat(data);
  if (data.length < BATCH) break;
  from += BATCH;
}
return all;
```

### Warum sicher
Exakt dasselbe Pattern läuft bereits produktiv in `AdminMitarbeiter.tsx` und `AdminBewertungen.tsx`. Filter, Sortierung, Tabs, Mutationen — nichts wird angefasst. Bei <1000 Datensätzen identisches Verhalten.

### Was NICHT geändert wird
- Keine RLS-Änderung, keine Migration, keine Edge Function, keine UI/Filter-Logik

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminBewerbungen.tsx` | Nur `queryFn` der `applications`-Query: `.range()`-Batch-Loop |

