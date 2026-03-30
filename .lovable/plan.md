

## Plan: Gehaltsauszahlung auf 30-Tage-Zyklus ab Startdatum umstellen

### Aenderungen

**1. `src/components/mitarbeiter/MitarbeiterLayout.tsx`**
- `desired_start_date` zur SELECT-Query der `employment_contracts` hinzufuegen (Zeile 69)
- `desired_start_date` zum `ContractData`-Interface hinzufuegen

**2. `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`**
- `desired_start_date` aus dem Contract-Details-Fetch lesen (Zeile 190, `desired_start_date` zur SELECT-Liste hinzufuegen)
- Neuen State `desiredStartDate` setzen
- `startDate` als neue Prop an `DashboardPayoutSummary` uebergeben (Zeile 589)

**3. `src/components/mitarbeiter/DashboardPayoutSummary.tsx`**
- Neue Prop `startDate?: string` hinzufuegen
- Import `addDays` statt `addMonths`/`startOfMonth`
- Berechnungslogik ersetzen: Vom `startDate` aus in 30-Tage-Schritten vorwaerts rechnen bis ein Datum in der Zukunft liegt. Fallback auf den 15. des Monats falls kein Startdatum vorhanden.

### Technische Details

```typescript
// DashboardPayoutSummary.tsx
const computeNextPayout = (startDateStr?: string): Date => {
  const today = new Date();
  if (!startDateStr) {
    const d15 = new Date(today.getFullYear(), today.getMonth(), 15);
    return today.getDate() < 15 ? d15 : new Date(today.getFullYear(), today.getMonth() + 1, 15);
  }
  const start = new Date(startDateStr);
  let next = new Date(start);
  while (next <= today) {
    next = new Date(next.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  return next;
};
```

Keine DB-Migration noetig — `desired_start_date` existiert bereits in `employment_contracts`.

