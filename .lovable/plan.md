

## Voraussichtlicher Betrag bei Minijob in Gehaltsauszahlung-Card

### Ziel
Bei Minijob-Verträgen mit Stundenlohn soll in der Gehaltsauszahlung-Card (MeineDaten + Dashboard) der voraussichtliche Monatsgehalt aus dem Branding angezeigt werden statt der berechneten Stundenlohn-Summe.

### Änderungen

**1. `MeineDaten.tsx` — Zeile 348-349 (Gehaltsauszahlung-Card)**
- Neue Bedingung: wenn `isHourlyRate` UND `employment_type === 'minijob'` UND `estimatedSalary > 0`, dann `estimatedSalary` anzeigen statt `hourlyEarnings`
- Label bleibt "Voraussichtlicher Betrag"

**2. `MitarbeiterDashboard.tsx` — Zeile 589 (DashboardPayoutSummary)**
- Branding-ContextType um `estimated_salary_minijob` erweitern
- Gleiche Bedingung: bei Minijob + Stundenlohn den estimated-Wert aus Branding übergeben statt `hourlyEarnings`

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `MeineDaten.tsx` | Bedingung für Minijob in Payout-Betrag |
| `MitarbeiterDashboard.tsx` | Bedingung für Minijob in DashboardPayoutSummary-Balance |

