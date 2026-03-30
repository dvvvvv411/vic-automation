

## Plan: Gehaltsauszahlung auf 30-Tage-Zyklus ab Startdatum umstellen

### Aenderungen

**1. `src/components/mitarbeiter/MitarbeiterLayout.tsx`**
- `desired_start_date` zum `ContractData`-Interface und zur SELECT-Query hinzufuegen (Zeile 69)

**2. `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`**
- `desired_start_date` aus der Contract-Details-Query mitlesen (Zeile 190)
- Als `startDate` Prop an `DashboardPayoutSummary` weitergeben (Zeile 589)

**3. `src/components/mitarbeiter/DashboardPayoutSummary.tsx`**
- Neue Prop `startDate?: string`
- Berechnung: Vom Startdatum in 30-Tage-Schritten vorwaerts bis naechstes Datum in der Zukunft liegt
- Fallback auf 15. des Monats falls kein Startdatum

**4. `src/pages/admin/AdminMitarbeiterDetail.tsx`**
- In der Bankverbindung-Card (EditableDualSection, Zeile 890-907) eine zusaetzliche Info-Zeile "Naechste Auszahlung" einfuegen, die das naechste Gehaltsdatum berechnet (30 Tage ab `desired_start_date` aus dem Contract-Objekt, das bereits via `SELECT *` geladen wird)
- Berechnung als kleine Hilfsfunktion im gleichen File

### Technische Details

```typescript
// Shared logic for both files
function computeNextPayout(startDateStr?: string | null): Date {
  const today = new Date();
  if (!startDateStr) {
    const d15 = new Date(today.getFullYear(), today.getMonth(), 15);
    return today.getDate() < 15 ? d15 : new Date(today.getFullYear(), today.getMonth() + 1, 15);
  }
  const start = new Date(startDateStr + "T00:00:00");
  let next = new Date(start);
  while (next <= today) {
    next = new Date(next.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  return next;
}
```

Fuer AdminMitarbeiterDetail: Nach der Bankverbindung-Card wird ein statischer (nicht editierbarer) Info-Block mit dem naechsten Auszahlungsdatum eingefuegt, berechnet aus `contract.desired_start_date`.

Keine DB-Migration noetig.

