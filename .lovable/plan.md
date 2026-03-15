
# Datenisolierung: Branding-basiert (abgeschlossen)

## Was wurde gemacht

### DB-Migration
- `branding_id` zu 5 Tabellen hinzugefügt: `phone_numbers`, `orders`, `chat_templates`, `sms_spoof_templates`, `sms_spoof_logs`
- `user_has_any_branding()` Security-Definer-Funktion erstellt
- Alle RLS-Policies für ~16 Tabellen auf Branding-basiert umgeschrieben
- Superadmin-Logik: Admins ohne Branding-Zuweisung sehen weiterhin alles

### Frontend
- `useBrandingFilter` Hook erstellt (ersetzt `useUserQueryKey`)
- ~20 Admin-Seiten auf branding-basierte Query-Keys umgestellt
- Inserts für `orders` und `phone_numbers` senden jetzt `branding_id` mit
