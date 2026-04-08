

## Plan: Dashboard-Payout-Betrag an MeineDaten angleichen

### Problem
Im Dashboard wird bei Stundenlohn-Mitarbeitern `hourlyEarnings` (tatsächlicher Verdienst aus Stunden × Stundensatz) als Betrag angezeigt. Auf `/mitarbeiter/meine-daten` wird dagegen `estimatedSalary` (das im Branding hinterlegte voraussichtliche Monatsgehalt) angezeigt. Die Werte sollen übereinstimmen.

### Lösung

**Datei: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`**, Zeile 591

Die `balance`-Prop für `DashboardPayoutSummary` bei `isHourlyRate` ändern: statt `hourlyEarnings` bzw. nur Minijob-Check soll dieselbe `getEstimatedMonthlySalary()`-Logik verwendet werden.

Konkret eine Hilfsfunktion hinzufügen (analog zu MeineDaten):

```typescript
const getEstimatedMonthlySalary = () => {
  if (!branding) return 0;
  switch (employmentType?.toLowerCase()) {
    case "minijob": return Number(branding.estimated_salary_minijob) || 0;
    case "teilzeit": return Number(branding.estimated_salary_teilzeit) || 0;
    case "vollzeit": return Number(branding.estimated_salary_vollzeit) || 0;
    default: return 0;
  }
};
```

Dann Zeile 591 vereinfachen:

```tsx
<DashboardPayoutSummary 
  balance={isHourlyRate ? getEstimatedMonthlySalary() : isFixedSalary ? fixedSalary : balance} 
  isFixedSalary={isFixedSalary && !isHourlyRate} 
  startDate={contractSubmittedAt} 
/>
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | `getEstimatedMonthlySalary()` Funktion hinzufügen, Payout-Balance auf estimated salary umstellen |

