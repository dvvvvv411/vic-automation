## Ziel
Auszahlungs-Berechnung soll auf dem **1. Arbeitstag-Termin** basieren statt auf Vertragsunterzeichnung / Wunschstartdatum. 1. Auszahlung = Termin + 30 Tage, danach in 30-Tage-Zyklen.

## Datenquelle
`first_workday_appointments.appointment_date` (verbunden per `contract_id` oder `application_id`).

Fallback-Kette, falls kein Termin gebucht:
1. `first_workday_appointments.appointment_date`
2. `employment_contracts.desired_start_date`
3. `employment_contracts.submitted_at`
4. 15. des Monats (bisheriges Verhalten)

## Code-Änderungen

1. **`src/pages/mitarbeiter/MitarbeiterDashboard.tsx`**
   - Zusätzlich `first_workday_appointments` für `contract.id` laden, `firstWorkdayDate` State setzen.
   - An `DashboardPayoutSummary` als neue Prop `firstWorkdayDate` übergeben (priorisiert vor `startDate`).

2. **`src/components/mitarbeiter/DashboardPayoutSummary.tsx`**
   - Neue Prop `firstWorkdayDate?: string | null`.
   - `computeNextPayout` nimmt zuerst `firstWorkdayDate`, sonst `startDate`, sonst Fallback.

3. **`src/pages/mitarbeiter/MeineDaten.tsx`** (Zeile 373)
   - `first_workday_appointments` zusätzlich laden, Berechnung auf neuen Wert umstellen.

4. **`src/pages/admin/AdminMitarbeiterDetail.tsx`** (Zeile 909–929)
   - `first_workday_appointments` zum Datenladen hinzufügen und in der Berechnung nutzen statt `desired_start_date`.

5. **Memory** `mem://features/payout-cycle-logic` aktualisieren: neue Basis = 1. Arbeitstag-Termin.

## Keine DB-Änderungen.