

## Plan: Badge fuer 1. Arbeitstag in Admin-Sidebar

### Umsetzung

In `src/components/admin/AdminSidebar.tsx`:

1. **Neuer Query** (nach dem bestehenden `probetagTodayCount`-Query, ~Zeile 173):
   - Zaehlt heutige Termine aus `first_workday_appointments` wo `appointment_date = today` und `appointment_time >= now`, gefiltert nach `employment_contracts.branding_id = activeBrandingId`
   - QueryKey: `["badge-erster-arbeitstag-heute", activeBrandingId]`
   - `refetchInterval: 30000`

2. **badgeCounts erweitern** (Zeile 210-219):
   - Neuen Eintrag: `"/admin/erster-arbeitstag": firstWorkdayTodayCount ?? 0`

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/components/admin/AdminSidebar.tsx` | Query fuer heutige 1.-Arbeitstag-Termine + Badge-Count-Eintrag |

