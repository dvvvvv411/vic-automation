## Ziel
In `/admin/mitarbeiter`-Tabelle zwei zusätzliche Infos auf einen Blick:
1. **Starterjobs**: `erledigt/gesamt - DD.MM.YYYY` (z. B. `1/2 - 06.06.2026`)
2. **Vertragsdaten**: `Nicht eingereicht` / `Eingereicht` / `AV Angenommen`

## Änderungen in `src/pages/admin/AdminMitarbeiter.tsx`

### 1) Status-Spalte umbenennen (aktuell „Status")
- Mapping anpassen (statt 4 Werte nur 3):
  - `offen` → Badge **Nicht eingereicht** (orange)
  - `eingereicht` → Badge **Eingereicht** (blau)
  - `genehmigt` oder `unterzeichnet` → Badge **AV Angenommen** (grün)
- `is_suspended`-Badge bleibt unverändert daneben.

### 2) Neue Spalte „Starterjobs" (vor „Aufträge")
- Neuer Query `starterJobStats`:
  - Hole alle `orders.id` mit `is_starter_job = true` und `branding_id = activeBrandingId` (oder `branding_id IS NULL`, analog zum DB-Trigger `assign_starter_jobs`).
  - Hole zugehörige `order_assignments` (`order_id IN (...starterOrderIds)`) batched mit `.range()`-Loop.
  - Optional: hole `order_appointments` für diese (contract_id, order_id)-Paare, um das Datum zu bestimmen.
- Aggregation pro `contract_id`:
  - `total` = Anzahl Assignments mit Starter-Order
  - `done` = Anzahl davon mit `status = 'erfolgreich'`
  - `latestDate` = letztes `appointment_date` aus `order_appointments` der erledigten Starter-Assignments; Fallback `assigned_at` des jüngsten erledigten Starter-Assignments.
- Anzeige in neuer `TableCell`:
  - Wenn `total === 0`: „–"
  - Sonst: `done/total` + (wenn `latestDate` vorhanden) ` - DD.MM.YYYY` (via vorhandenes `formatDate`).
  - Farbe: grün wenn `done === total && total > 0`, sonst muted/orange.

### 3) Header
- `<TableHead>Starterjobs</TableHead>` neu zwischen „Startdatum" und „Aufträge".

## Nicht betroffen
- DB-Schema, RLS, andere Seiten, Detailansicht.
