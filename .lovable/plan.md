

## Plan: Drei Anpassungen für Mitarbeiter-Ansichten

### 1. Verdienst-Historie nur bei "Vergütung pro Auftrag" anzeigen

**Datei: `src/pages/mitarbeiter/MeineDaten.tsx`**, Zeile 386

`(!isFixedSalary || isHourlyRate)` → `!isFixedSalary`

Bei Festgehalt-Brandings (egal ob mit Stundenlohn oder ohne) wird die Verdienst-Historie ausgeblendet. Nur bei `payment_model === 'per_order'` bleibt sie sichtbar.

### 2. Voraussichtlicher Betrag = Statistiken-Wert

**Datei: `src/pages/mitarbeiter/MeineDaten.tsx`**, Zeile 376

Die Betragslogik in der Bankverbindung-Card vereinheitlichen: Bei `isHourlyRate` wird `estimatedSalary` statt `hourlyEarnings` angezeigt (identisch mit der Statistiken-Card "Voraussichtl. Gehalt").

### 3. Auszahlungsdatum = 30 Tage nach Vertragsunterzeichnung

**Datei: `src/pages/mitarbeiter/MeineDaten.tsx`**, Zeile 372

Die Inline-Berechnung (15. des Monats) durch 30-Tage-Zyklen ab `contractExtra?.submitted_at` ersetzen — gleiche Logik wie `computeNextPayout` in `DashboardPayoutSummary.tsx`.

**Datei: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`**, Zeile 591

`startDate={desiredStartDate}` → `startDate={contractSubmittedAt}` — damit auch das Dashboard-Widget `submitted_at` als Basis nutzt.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/mitarbeiter/MeineDaten.tsx` | Verdienst-Historie nur bei per_order; Betrag = estimatedSalary bei Stundenlohn; Auszahlung ab submitted_at |
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | `startDate` von `desiredStartDate` auf `contractSubmittedAt` |

