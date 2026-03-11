

# Bug: Zugewiesene Aufträge nicht sichtbar für Admin/Kunde

## Ursache

Die Spalte `created_by` in der Tabelle `order_assignments` hat **keinen Default-Wert**. Der AssignmentDialog setzt `created_by` beim Insert nicht explizit. Dadurch ist `created_by = NULL`.

Die RLS-Policy für Kunden (und Admins mit Data-Isolation) lautet:
```
created_by = auth.uid()
```
Da `NULL ≠ auth.uid()`, kann der eingeloggte User seine eigenen Zuweisungen nicht mehr lesen, löschen oder als bestehend erkennen.

Der Mitarbeiter sieht den Auftrag, weil seine SELECT-Policy nur auf `contract_id` prüft, nicht auf `created_by`.

## Lösung

**Eine Migration**: Default-Wert `auth.uid()` auf `order_assignments.created_by` setzen + bestehende NULL-Werte reparieren.

```sql
ALTER TABLE public.order_assignments
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Bestehende NULL-Einträge bleiben für Admins sichtbar (created_by IS NULL),
-- daher kein UPDATE nötig.
```

**Keine Code-Änderung nötig** -- der Default greift automatisch bei jedem INSERT.

| Änderung | Datei/Ort |
|----------|-----------|
| Migration: Default `auth.uid()` auf `created_by` | SQL Migration |

