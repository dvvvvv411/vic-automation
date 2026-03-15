

# Vergütungsmodell pro Branding: Festgehalt vs. Pro Auftrag

## Übersicht
Jedes Branding bekommt eine Einstellung, ob Mitarbeiter **pro Auftrag** (bisheriges Verhalten) oder per **Festgehalt** bezahlt werden. Bei Festgehalt werden Gehaltsbeträge für Minijob, Teilzeit und Vollzeit hinterlegt.

## 1. Datenbank-Migration

Neue Spalten auf `brandings`:
```sql
ALTER TABLE public.brandings
  ADD COLUMN payment_model text NOT NULL DEFAULT 'per_order',
  ADD COLUMN salary_minijob numeric,
  ADD COLUMN salary_teilzeit numeric,
  ADD COLUMN salary_vollzeit numeric;
```
- `payment_model`: `'per_order'` (Default, bestehende Brandings bleiben unverändert) oder `'fixed_salary'`
- Die drei Gehaltsspalten sind nullable und nur relevant wenn `payment_model = 'fixed_salary'`

## 2. Branding-Formular erweitern (`AdminBrandings.tsx`)

Neuer Abschnitt im Dialog nach der SMS-Konfiguration:
- **Divider**: "Vergütungsmodell"
- **RadioGroup**: "Vergütung pro Auftrag" (default) / "Festgehalt"
- **Bedingte Felder** (nur bei Festgehalt): Drei Inputs für Minijob, Teilzeit, Vollzeit (jeweils in €)
- Schema (`brandingSchema`) erweitern um `payment_model`, `salary_minijob`, `salary_teilzeit`, `salary_vollzeit`
- `openEdit` und `initialForm` entsprechend anpassen

## 3. Auftrag-Wizard anpassen (`AdminAuftragWizard.tsx`)

- Das aktive Branding abfragen um `payment_model` zu kennen
- Wenn `payment_model === 'fixed_salary'`: Das Feld "Vergütungsbetrag (€)" ausblenden und `reward` auf `"0"` setzen (DB-Constraint: NOT NULL)
- `canSave` Logik anpassen: Bei Festgehalt ist `reward` nicht mehr Pflicht

## 4. Mitarbeiter-Dashboard anpassen (`MitarbeiterDashboard.tsx`)

- Branding-Daten um `payment_model`, `salary_minijob`, `salary_teilzeit`, `salary_vollzeit` erweitern (über `MitarbeiterLayout.tsx` laden)
- Employment Contract hat `employment_type` (Minijob/Teilzeit/Vollzeit) -- daraus den passenden Gehaltswert ableiten

**Bei `payment_model === 'fixed_salary'`:**
- **Stats-Grid**: "Guthaben" Card durch "Festgehalt" ersetzen (zeigt den fixen Betrag basierend auf `employment_type`)
- **Auftrags-Cards**: Zeile "Prämie" ausblenden
- **DashboardPayoutSummary**: Festen Gehaltsbetrag statt `balance` anzeigen

## 5. Auftragsdetails anpassen (`AuftragDetails.tsx`)

- Bei `fixed_salary` Branding: Vergütungs-/Prämien-Anzeigen ausblenden

## 6. MitarbeiterLayout erweitern

- Branding-Query erweitert um: `payment_model, salary_minijob, salary_teilzeit, salary_vollzeit`
- Diese Daten im Outlet-Context durchreichen

## Betroffene Dateien
1. **Migration** (neue Spalten auf `brandings`)
2. `src/pages/admin/AdminBrandings.tsx` -- Formular erweitern
3. `src/pages/admin/AdminAuftragWizard.tsx` -- Reward-Feld bedingt ausblenden
4. `src/components/mitarbeiter/MitarbeiterLayout.tsx` -- erweiterte Branding-Daten laden
5. `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` -- Prämie/Guthaben bedingt anzeigen
6. `src/components/mitarbeiter/DashboardPayoutSummary.tsx` -- Festgehalt statt Balance
7. `src/pages/mitarbeiter/AuftragDetails.tsx` -- Vergütung ausblenden bei Festgehalt

