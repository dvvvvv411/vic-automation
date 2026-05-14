# Plan: Datenbank komplett wiederherstellen

## Gute Nachricht zuerst

Im Projekt existieren **alle 151 Migrations-Dateien** noch unter `supabase/migrations/` (~228 KB, ~4.474 SQL-Zeilen). Das sind die exakten Original-Schritte, mit denen die Datenbank über die letzten Wochen aufgebaut wurde – also keine Rekonstruktion aus Chat-Erinnerung, sondern 1:1 die echten Befehle. Genauso sind alle **Edge Functions** (`supabase/functions/`), die **Storage Buckets** und alle **Secrets** weiterhin vorhanden und müssen nicht neu angelegt werden.

Was rein technisch verloren ist: die **Daten** in den Tabellen (Mitarbeiter, Aufträge, Verträge, Chat-Verlauf, etc.). Die kann niemand mehr zurückholen, wenn das alte Supabase-Projekt gelöscht ist. Nur die Struktur lässt sich wiederherstellen.

## Was wiederhergestellt wird

Aus den 151 Migrations rekonstruiere ich:

- **Alle ~33 Tabellen**: `profiles`, `user_roles`, `brandings`, `kunde_brandings`, `applications`, `interview_appointments`, `trial_day_appointments`, `first_workday_appointments`, `first_workday_blocked_slots`, `trial_day_blocked_slots`, `schedule_blocked_slots`, `branding_schedule_settings`, `branding_notes`, `employment_contracts`, `contract_templates`, `orders`, `order_assignments`, `order_attachments`, `order_appointments`, `order_reviews`, `chat_messages`, `chat_templates`, `email_logs`, `sms_logs`, `sms_templates`, `sms_spoof_logs`, `sms_spoof_templates`, `telegram_chats`, `phone_numbers`, `ident_sessions`, `short_links`, `admin_permissions`.
- **Alle Enums** (z.B. `app_role` mit `admin/user/kunde/caller`).
- **Alle ~30 Datenbank-Funktionen** (z.B. `has_role`, `is_kunde`, `is_caller`, `user_branding_ids`, `user_can_read_branding`, `book_first_workday_public`, `submit_employment_contract`, `approve_employment_contract`, `assign_starter_jobs`, `normalize_email_lowercase`, `decrement_spoof_credits`, `handle_new_user`, `handle_new_user_role`, `update_*_status`-Funktionen, `*_booked_slots_for_branding` usw.).
- **Alle Trigger** (E-Mail-Lowercase, Auto-Profile-Anlage, Starter-Job-Zuweisung, `set_contract_branding_id`, `create_contract_on_interview_success`).
- **Alle RLS-Policies** für jede Tabelle (Admin/Kunde/User/Caller-Trennung, Branding-Isolation, Public-Booking-Zugriffe via SECURITY DEFINER).
- **Realtime-Konfiguration** inkl. `REPLICA IDENTITY FULL` und Publication für `chat_messages` und `employment_contracts`.
- **Storage-Policies** für die bereits existierenden Buckets (`avatars`, `branding-logos`, `contract-documents`, `application-documents`, `chat-attachments`, `order-attachments`).

## Vorgehen

1. **Konsolidierte Migration zusammenstellen** – Ich kombiniere die 151 Dateien in der korrekten chronologischen Reihenfolge zu einer einzigen großen SQL-Migration. Innerhalb der Datei wird jede Original-Migration als Block belassen, sodass im Fehlerfall klar ist, welcher Schritt klemmt.
2. **Idempotenz-Härtung** – Überall wo nötig setze ich `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS` vor `CREATE POLICY` etc., damit die Migration auf der leeren neuen DB sauber durchläuft, ohne an doppelten Objekten zu scheitern.
3. **Auth-Trigger** – Re-Erzeugung der Trigger auf `auth.users` (`handle_new_user` für `profiles`, `handle_new_user_role` für `user_roles`), damit Self-Registration sofort wieder funktioniert.
4. **Ausführen** über das Migrations-Tool. Du bestätigst die Migration einmal, dann wird sie auf der angebundenen leeren DB ausgeführt.
5. **Lint-Run** danach (Supabase Security Linter) – falls Warnungen auftauchen, werden die direkt nachgezogen.
6. **Smoke-Test-Hinweise** – ich liste am Ende konkret auf, was du nach dem Restore prüfen solltest (Login als Admin anlegen, ein Branding anlegen, Public-Booking aufrufen, Chat-Realtime testen).

## Was NICHT Teil dieses Plans ist

- **Daten-Restore**: Mitarbeiterdaten, Bewerbungen, Verträge, Chat-Verlauf, SMS-Logs etc. lassen sich nicht zurückholen. Wenn du irgendwo noch ein Backup (CSV/SQL-Dump des alten Projekts) hast, machen wir das in einem separaten Schritt.
- **Edge Functions neu deployen**: Die werden bei jedem Code-Deploy automatisch wieder hochgeladen, sobald sie existieren. Da der Code unverändert ist, passiert das im normalen Loop.
- **Auth-User neu anlegen**: Du musst dir nach dem Restore über `/auth` einen neuen Account erstellen und dem in der `user_roles`-Tabelle die Rolle `admin` zuweisen (kann ich danach per SQL für dich machen, sobald du mir die E-Mail nennst).

## Risiken

- Falls Supabase intern minimale Schema-Unterschiede zwischen Projekten hat (z.B. neue `auth`-Spalten), kann eine Migration schiefgehen. In dem Fall fixe ich den konkreten Block und führe nur den Rest aus.
- Die Reihenfolge der 151 Migrations ist nach Dateiname sortiert chronologisch korrekt – darauf verlasse ich mich.

Sag Bescheid, wenn ich loslegen soll.
