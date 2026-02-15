

# Sortierung der Auftrags-Cards nach Status

## Aenderung

Die Auftrags-Cards auf `/mitarbeiter/auftraege` werden nach Status sortiert, sodass offene Auftraege immer zuerst erscheinen.

**Sortierreihenfolge:**
1. Offen
2. In Ueberprüfung
3. Fehlgeschlagen
4. Erfolgreich

## Technische Umsetzung

**Datei**: `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`

Nach dem Filtern (`filtered`) wird ein zusaetzlicher Sortierungsschritt eingefuegt, der die Cards anhand einer Status-Prioritaet ordnet:

```typescript
const statusOrder: Record<string, number> = {
  offen: 0,
  in_pruefung: 1,
  fehlgeschlagen: 2,
  erfolgreich: 3,
};

const sorted = [...filtered].sort(
  (a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
);
```

`sorted` wird dann anstelle von `filtered` im Grid gerendert. Innerhalb desselben Status bleibt die bestehende Sortierung nach `assigned_at` (neueste zuerst) erhalten, da `Array.sort` stabil ist.

