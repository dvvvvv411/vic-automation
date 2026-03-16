

## Plan: Zwei neue Dashboard-Sektionen hinzufuegen

### 1. Stat-Card "Wartende Idents" (oben, neben den bestehenden 5 Cards)

Neue Stat-Card in der oberen Reihe hinzufuegen:
- Query: `ident_sessions` mit `status` in `('waiting', 'data_sent')` gefiltert nach `branding_id`
- Icon: `Video` (wie in AdminIdents), Akzentfarbe: teal/cyan
- Klick navigiert zu `/admin/idents`
- `STAT_BORDERS` um einen 6. Eintrag erweitern

### 2. Komponente "Anstehende Probetag-Termine" (unterhalb UpcomingStartDates)

Neue Komponente `UpcomingTrialDays.tsx` analog zu `UpcomingStartDates.tsx`:
- Query: `trial_day_appointments` mit `appointment_date >= today`, Join auf `applications!inner(first_name, last_name, branding_id)`, gefiltert nach `branding_id`, sortiert aufsteigend nach Datum+Uhrzeit
- Grid-Layout mit kleinen Cards: Name, Datum+Uhrzeit, Status-Badge
- Status-Styles: `ausstehend`, `erschienen`, `nicht_erschienen`, `erfolgreich`, `abgelehnt`
- Icon: `Calendar` mit Titel "Anstehende Probetag-Termine"

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminDashboard.tsx` | 6. Stat-Card fuer wartende Idents + Import/Rendering von `UpcomingTrialDays` |
| `src/components/admin/UpcomingTrialDays.tsx` | Neue Komponente (analog UpcomingStartDates) |

