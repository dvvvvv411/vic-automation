

# Bewertungen für Kunden nicht sichtbar -- RLS-Problem

## Problem
Die `order_reviews` Tabelle hat eine RLS-Policy für Kunden:
```sql
is_kunde(auth.uid()) AND (created_by = auth.uid())
```

Aber die Reviews haben `created_by = NULL` (da sie von Mitarbeitern erstellt werden, nicht vom Kunden). Der Kunde test@test.de kann daher keine Reviews sehen, obwohl die zugehörigen Contracts ihm gehören (`employment_contracts.created_by = 582dca81...`).

## Lösung
Die bestehende Kunden-SELECT-Policy auf `order_reviews` ersetzen. Statt `created_by = auth.uid()` prüfen wir, ob der Review zu einem Contract gehört, der dem Kunden gehört:

```sql
DROP POLICY "Kunden can select own order_reviews" ON order_reviews;

CREATE POLICY "Kunden can select own order_reviews"
  ON order_reviews FOR SELECT TO authenticated
  USING (
    is_kunde(auth.uid()) 
    AND contract_id IN (
      SELECT id FROM employment_contracts WHERE created_by = auth.uid()
    )
  );
```

Gleicher Ansatz auch für die DELETE-Policy, damit Kunden Reviews ihrer Mitarbeiter verwalten können:

```sql
DROP POLICY "Admins can delete order_reviews" ON order_reviews;

CREATE POLICY "Admins and Kunden can delete order_reviews"
  ON order_reviews FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin') AND (created_by = auth.uid() OR created_by IS NULL))
    OR (is_kunde(auth.uid()) AND contract_id IN (
      SELECT id FROM employment_contracts WHERE created_by = auth.uid()
    ))
  );
```

Auch die zugehörigen Tabellen `orders` und `order_assignments` müssen für den Kunden die richtigen Daten liefern -- diese haben bereits passende Kunden-Policies über `created_by`.

## Betroffene Dateien
Nur Datenbank-Migration, kein Code-Change nötig.

