

# Fix: Admin sieht keine Daten wegen fehlerhafter RLS-Logik

## Problem
Die RLS-Policies haben dieses Muster:
```sql
(has_role('admin') OR is_kunde()) AND (NOT user_has_any_branding() OR branding_id IN ...)
```
Das `AND` gilt für **beide** Rollen. Admin-User `7f509e3d` hat auch einen `kunde_brandings`-Eintrag, deshalb gibt `user_has_any_branding()` `true` zurück und der Superadmin-Fallback greift nicht. Der Admin sieht nur Daten des einen zugewiesenen Brandings statt aller.

## Lösung
Die Logik muss umgebaut werden: **Admins passieren RLS immer**, die Branding-Prüfung gilt nur für Kunden:

```sql
-- ALT (fehlerhaft):
(has_role('admin') OR is_kunde()) AND (NOT user_has_any_branding() OR branding_id IN ...)

-- NEU (korrekt):
has_role(auth.uid(), 'admin')
OR (
  is_kunde(auth.uid()) 
  AND (
    NOT user_has_any_branding(auth.uid()) 
    OR branding_id IN (SELECT user_branding_ids(auth.uid()))
  )
)
```

Die Frontend-Filterung `.eq("branding_id", activeBrandingId)` sorgt weiterhin dafür, dass der Admin nur das aktive Branding sieht -- RLS blockiert ihn aber nicht mehr.

## Betroffene Policies
Eine DB-Migration die alle ~20 Admin/Kunde-Policies auf allen Tabellen aktualisiert:
- `applications` (SELECT, UPDATE, DELETE)
- `employment_contracts` (SELECT, UPDATE, DELETE)
- `interview_appointments` (SELECT, UPDATE, DELETE)
- `trial_day_appointments` (SELECT, UPDATE, DELETE)
- `chat_messages` (SELECT, UPDATE)
- `order_assignments` (SELECT, UPDATE, DELETE)
- `order_reviews` (SELECT, DELETE)
- `order_appointments` (SELECT, UPDATE, DELETE)
- `orders` (SELECT, UPDATE, DELETE)
- `phone_numbers` (ALL)
- `chat_templates` (ALL)
- `sms_spoof_templates` (ALL)
- `sms_spoof_logs` (SELECT)
- `sms_logs` (SELECT -- Kunde-Policy)
- `schedule_blocked_slots` (ALL)
- `order_appointment_blocked_slots` (ALL)
- `branding_schedule_settings` (ALL)
- `brandings` (SELECT, UPDATE, DELETE)

Muster je Tabellentyp:
- **Direkt branding_id**: `has_role('admin') OR (is_kunde() AND branding check)`
- **Indirekt via application_id**: `has_role('admin') OR (is_kunde() AND application_id IN (...))`
- **Indirekt via contract_id**: `has_role('admin') OR (is_kunde() AND contract_id IN (...))`
- **INSERT-Policies** bleiben unverändert (haben kein USING, nur WITH CHECK)

## Keine Frontend-Änderungen nötig
Das Frontend filtert bereits korrekt per `.eq("branding_id", activeBrandingId)`. Das Problem ist rein RLS-seitig.

