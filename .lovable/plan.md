

# Sortierung der Arbeitsvertraege-Tabelle

## Uebersicht

Die Tabelle auf `/admin/arbeitsvertraege` wird automatisch sortiert: zuerst nach Vertragsstatus (Unterzeichnet > Genehmigt > Eingereicht > Offen), dann innerhalb jeder Statusgruppe nach Startdatum (naechstes Datum oben, vergangene unten).

## Aenderung

**Datei: `src/pages/admin/AdminArbeitsvertraege.tsx`**

Nach dem Laden der Daten (`items`) wird ein `useMemo` eingefuegt, das die Eintraege sortiert:

1. **Status-Prioritaet**: Jeder Status bekommt einen numerischen Rang:
   - `unterzeichnet` = 0
   - `genehmigt` = 1
   - `eingereicht` = 2
   - kein Vertrag / `offen` = 3

2. **Startdatum-Sortierung** (innerhalb gleicher Status-Gruppe):
   - Eintraege mit zukuenftigem oder heutigem Startdatum kommen vor vergangenen
   - Zukuenftige Daten: aufsteigend (naechstes zuerst)
   - Vergangene Daten: absteigend (juengstes zuerst)
   - Eintraege ohne Startdatum ganz am Ende der jeweiligen Gruppe

Keine Aenderung an der Datenbank-Abfrage oder anderen Dateien noetig. Die Sortierung passiert rein clientseitig ueber die bereits geladenen Daten.

### Technische Umsetzung

Neues `useMemo` nach der Query:

```typescript
const sortedItems = useMemo(() => {
  if (!data?.items) return [];
  const statusOrder: Record<string, number> = {
    unterzeichnet: 0,
    genehmigt: 1,
    eingereicht: 2,
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [...data.items].sort((a, b) => {
    const rankA = statusOrder[a.contract?.status] ?? 3;
    const rankB = statusOrder[b.contract?.status] ?? 3;
    if (rankA !== rankB) return rankA - rankB;

    const dateA = a.contract?.desired_start_date
      ? new Date(a.contract.desired_start_date + "T00:00:00")
      : null;
    const dateB = b.contract?.desired_start_date
      ? new Date(b.contract.desired_start_date + "T00:00:00")
      : null;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    const futureA = dateA >= today;
    const futureB = dateB >= today;
    if (futureA && !futureB) return -1;
    if (!futureA && futureB) return 1;
    if (futureA && futureB) return dateA.getTime() - dateB.getTime();
    return dateB.getTime() - dateA.getTime();
  });
}, [data?.items]);
```

In der Tabelle wird dann `sortedItems` statt `data.items` iteriert.

