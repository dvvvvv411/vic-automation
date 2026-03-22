

## Voraussichtlicher Monatsgehalt bei Stundenlohn

### Ziel
Neue Eingabefelder im Branding für "voraussichtlicher Monatsgehalt" pro Anstellungsart (nur sichtbar bei Festgehalt + Stundenlohn). Der Wert wird in der Mitarbeiter "Meine Daten"-Seite in der Verdienst-StatCard angezeigt.

### Änderungen

**1. DB-Migration**: 3 neue nullable Spalten in `brandings`:
- `estimated_salary_minijob` (numeric)
- `estimated_salary_teilzeit` (numeric)
- `estimated_salary_vollzeit` (numeric)

**2. `AdminBrandingForm.tsx`**:
- Schema + initialForm + useEffect um die 3 Felder erweitern
- `numericFields`-Array um die 3 Keys erweitern
- Unter dem Stundenlohn-Grid (Zeile ~527) ein weiteres Grid mit Label "Voraussichtlicher Monatsgehalt" und 3 Inputs (Minijob/Teilzeit/Vollzeit in €)

**3. `MeineDaten.tsx`**:
- Branding-ContextType um die 3 neuen Felder erweitern
- Neue Hilfsfunktion `getEstimatedMonthlySalary()` analog zu `getFixedSalary()` die basierend auf `employment_type` den passenden Wert liefert
- In der StatCard-Zeile (Zeile ~286): wenn `isHourlyRate`, den Label auf "Voraussichtl. Gehalt" ändern und den estimated-Wert anzeigen statt `hourlyEarnings`

**Keine weiteren Änderungen** — Verdienst-Historie, Payout-Card etc. bleiben unverändert.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| Migration | 3 neue Spalten |
| `AdminBrandingForm.tsx` | Schema + 3 Inputs unter Stundenlohn |
| `MeineDaten.tsx` | StatCard zeigt voraussichtlichen Monatsgehalt |

