
# Datenisolierung: Branding-basiert (abgeschlossen)

## Was wurde gemacht

### DB-Migration
- `branding_id` zu 6 Tabellen hinzugefügt: `phone_numbers`, `orders`, `chat_templates`, `sms_spoof_templates`, `sms_spoof_logs`, `employment_contracts`
- `user_has_any_branding()` Security-Definer-Funktion erstellt
- Alle RLS-Policies für ~16 Tabellen auf Branding-basiert umgeschrieben
- Superadmin-Logik: Admins ohne Branding-Zuweisung sehen weiterhin alles
- `employment_contracts.branding_id` wird automatisch per Trigger aus `applications.branding_id` befüllt
- `contracts_for_branding_ids()` nutzt jetzt direkt `employment_contracts.branding_id`
- RLS-Policies für `employment_contracts` nutzen direkt `branding_id` statt `apps_for_branding_ids()`

### Frontend
- `useBrandingFilter` Hook erstellt (ersetzt `useUserQueryKey`)
- ~20 Admin-Seiten auf branding-basierte Query-Keys umgestellt
- Inserts für `orders` und `phone_numbers` senden jetzt `branding_id` mit
- `employment_contracts` Queries nutzen direkt `.eq("branding_id", ...)` statt `applications!inner(branding_id)` Join
- `AdminBewertungen` filtert Bewertungen über Mitarbeiter-Branding statt über Order-Branding
