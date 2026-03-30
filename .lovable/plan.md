

## Plan: Gehaltsauszahlung auf 30-Tage-Zyklus ab Startdatum umstellen

### Aktuell
Die naechste Auszahlung wird fix auf den 15. jedes Monats berechnet (Zeilen 16-18 in `DashboardPayoutSummary.tsx`).

### Aenderung
Die naechste Auszahlung soll alle 30 Tage ab dem `desired_start_date` des Mitarbeiters berechnet werden.

**Logik:** Vom Startdatum aus in 30-Tage-Schritten vorwaerts rechnen, bis das naechste Datum in der Zukunft liegt. Beispiel: Start 10.01. → Auszahlungen 09.02., 11.03., 10.04. usw.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/mitarbeiter/MitarbeiterLayout.tsx` | `desired_start_date` aus `employment_contracts` mitlesen und via Outlet-Context weitergeben |
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | `desired_start_date` aus Context entnehmen und an `DashboardPayoutSummary` als neue Prop uebergeben |
| `src/components/mitarbeiter/DashboardPayoutSummary.tsx` | Neue Prop `startDate?: string`, Auszahlungslogik auf 30-Tage-Zyklus umstellen. Fallback auf 15.-des-Monats falls kein Startdatum vorhanden. |

### Technische Details

```typescript
// DashboardPayoutSummary.tsx — neue Berechnung
const computeNextPayout = (startDateStr?: string): Date => {
  const today = new Date();
  if (!startDateStr) {
    // Fallback: 15. des Monats
    const d15 = new Date(today.getFullYear(), today.getMonth(), 15);
    return today.getDate() < 15 ? d15 : new Date(today.getFullYear(), today.getMonth() + 1, 15);
  }
  const start = new Date(startDateStr);
  let next = new Date(start);
  while (next <= today) {
    next = addDays(next, 30);
  }
  return next;
};
```

Keine DB-Migration noetig — `desired_start_date` existiert bereits in `employment_contracts`.

