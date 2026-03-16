

## Problem

`AssignmentDialog` lädt bei `mode="order"` alle Verträge ohne Branding-Filter und bei `mode="contract"` alle Aufträge ohne Branding-Filter. Dadurch sieht der Admin Aufträge/Mitarbeiter aus anderen Brandings.

## Lösung

`AssignmentDialog` bekommt ein neues Prop `brandingId?: string` und filtert die Queries damit:

### `AssignmentDialog.tsx`

1. Neues optionales Prop `brandingId` im Interface
2. Bei `mode === "order"` (Mitarbeiter laden): `.eq("branding_id", brandingId)` auf `employment_contracts`
3. Bei `mode === "contract"` (Aufträge laden): `.eq("branding_id", brandingId)` auf `orders`
4. Query-Key um `brandingId` erweitern

### Aufrufer anpassen

Alle drei Stellen übergeben bereits `useBrandingFilter()` → `activeBrandingId` weiterreichen:

- `AdminAuftraege.tsx`: `<AssignmentDialog brandingId={