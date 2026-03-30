

## Plan: RLS-Policy fuer first_workday_appointments fixen (Kunde-Rolle)

### Problem
Die RLS SELECT-Policy fuer `first_workday_appointments` prueft fuer Kunde-User nur `application_id IN (apps_for_branding_ids(...))`. Termine die ueber `contract_id` verknuepft sind (und `application_id = NULL` haben), werden nicht zurueckgegeben.

### Loesung
Die bestehenden RLS-Policies fuer SELECT, UPDATE, DELETE und INSERT auf `first_workday_appointments` erweitern, sodass Kunde-User auch ueber `contract_id` Zugriff erhalten — analog zu den Policies bei `order_appointments`.

### Aenderung (DB-Migration)

Alle 4 Kunde/Caller-Policies (SELECT, UPDATE, DELETE, INSERT) aktualisieren. Der Kern der Aenderung am Beispiel SELECT:

```sql
DROP POLICY "Admins can select first_workday_appointments" ON public.first_workday_appointments;
CREATE POLICY "Admins can select first_workday_appointments"
ON public.first_workday_appointments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
  OR (is_caller(auth.uid()) AND (
    application_id IN (SELECT apps_for_branding_ids(auth.uid()))
    OR contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))
  ))
);
```

Gleiche Erweiterung fuer UPDATE, DELETE und INSERT Policies — ueberall `OR contract_id IN (SELECT contracts_for_branding_ids(...))` hinzufuegen.

### Betroffene Dateien
| Datei | Aenderung |
|---|---|
| Neue SQL-Migration | 4 RLS-Policies auf `first_workday_appointments` aktualisieren |

Keine Frontend-Aenderungen noetig.

