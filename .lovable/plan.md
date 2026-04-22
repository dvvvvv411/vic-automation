

## Plan: Korrekte Zuweisungs-Zähler überall — `/admin/auftraege`, `/admin/mitarbeiter` & AssignmentDialog

### Problem
Die Aggregations-Queries auf `order_assignments` laufen ohne Pagination und werden bei > 1000 Zeilen von Supabase abgeschnitten. Aktuell existieren bereits **1152 Zuweisungen** in der DB → Zähler-Badges zeigen überall zu kleine Werte.

Betroffen:
1. **`/admin/auftraege`** → Badge „X zugewiesen" pro Auftragskarte
2. **`/admin/mitarbeiter`** → Badge „X Aufträge" pro Mitarbeiter
3. **„Mitarbeiter zuweisen"-Popup** (`AssignmentDialog`) → Auftrags-Counter pro Mitarbeiter

### Lösung
Alle drei `assignmentCounts`-Queries auf die etablierte `.range()`-Batch-Loop-Strategie umstellen (siehe Memory `tech/supabase-row-limit-constraint`).

### Umsetzung

**Datei 1:** `src/pages/admin/AdminAuftraege.tsx`
- `assignmentCounts`-Query (`["order_assignments", "counts_by_order", activeBrandingId]`) mit Batch-Loop:
  - `pageSize = 1000`, `from = 0`
  - Schleife `select("order_id").range(from, from+999)` bis Batch < 1000
  - Optional: `.in("order_id", orderIds)` nach den `orders` des aktiven Brandings scopen
- Aggregation zur `Record<string, number>`-Map bleibt identisch

**Datei 2:** `src/pages/admin/AdminMitarbeiter.tsx`
- `assignmentCounts`-Query mit `.range()`-Batch-Loop
- `select("contract_id")` in 1000er-Batches

**Datei 3:** `src/components/admin/AssignmentDialog.tsx`
- `assignmentCounts`-Query (`counts_by_contract`) mit `.range()`-Batch-Loop
- `select("contract_id")` in 1000er-Batches
- Globaler Scope bleibt (Counter zählt alle Aufträge eines Mitarbeiters)

### Was NICHT geändert wird
- Keine UI-/Layout-Änderung
- Keine Mutationen, RLS, Edge-Functions, DB-Schema
- Keine Änderung an Tabs/Selection-/Footer-Logik des Dialogs

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminAuftraege.tsx` | `assignmentCounts` Batch-Loop + branding-scope |
| `src/pages/admin/AdminMitarbeiter.tsx` | `assignmentCounts` Batch-Loop |
| `src/components/admin/AssignmentDialog.tsx` | `assignmentCounts` (counts_by_contract) Batch-Loop |

### Erwartetes Ergebnis
Alle Zuweisungs-Zähler (auf Auftragskarten, Mitarbeiterliste und im Zuweisen-Popup) zeigen die **tatsächliche** Anzahl — auch bei > 1000 Zuweisungen projektweit.

