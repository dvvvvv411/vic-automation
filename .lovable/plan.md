## Problem

Auf `/mitarbeiter` (Dashboard + Meine Daten) wird als „Voraussichtliches Gehalt" / „Gehaltsauszahlung" der Wert aus dem Branding (`estimated_salary_minijob/teilzeit/vollzeit`) angezeigt. Korrekt wäre das `salary` aus der vom Mitarbeiter ausgewählten Vertragsvorlage (`contract_templates.salary`, referenziert über `employment_contracts.template_id`).

## Fix

1. **`MitarbeiterLayout.tsx`** — beim Laden des `employment_contracts`-Datensatzes zusätzlich `template_id` selecten und, falls vorhanden, die zugehörige Vorlage (`contract_templates.salary`) nachladen. Den Wert als `templateSalary` in den Outlet-Context legen.

2. **`MitarbeiterDashboard.tsx`** — `getEstimatedMonthlySalary()` ersetzt: wenn `templateSalary` vorhanden, diesen nutzen; sonst Fallback auf bisherigen `estimated_salary_*` Wert (damit Mitarbeiter ohne ausgewählte Vorlage nicht leer dastehen).

3. **`MeineDaten.tsx`** — gleiche Logik: `estimatedSalary` zieht primär aus `templateSalary`, sonst Branding-Fallback. Betrifft die StatCard „Voraussichtl. Gehalt" und die „Gehaltsauszahlung"-Box (Hourly-Rate-Anzeige).

4. Keine Änderungen an Branding-Settings, Verträgen oder DB-Schema — `template_id` existiert bereits auf `employment_contracts`.

## Nicht betroffen

- Hourly-Rate-Logik bleibt strukturell gleich, nutzt nur den neuen Wert.
- `isFixedSalary` (Festgehalt-Modell) bleibt unverändert — dort kommt das Gehalt weiterhin aus Branding.
