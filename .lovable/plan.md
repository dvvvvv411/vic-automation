

# SMS History: Branding-Zuordnung & Nutzerkonto-Anzeige

## Problem
1. **Seven.io SMS** haben keine Branding-Zuordnung — man sieht nicht, welches Branding die SMS ausgelöst hat
2. **Spoof SMS** zeigen "System" statt des tatsächlichen Nutzerkontos, weil:
   - RLS-Policy auf `sms_spoof_logs` filtert `created_by = auth.uid()` — Admin sieht nur eigene Logs, nicht die von Kunden
   - `profiles` Tabelle hat kein `email`-Feld — nur `full_name` wird angezeigt
3. Per-User-Breakdown unterscheidet nicht nach Branding

## Lösung

### 1. DB-Migration
- `sms_logs`: Spalte `branding_id UUID` hinzufügen (referenziert Brandings)
- `profiles`: Spalte `email TEXT` hinzufügen
- `handle_new_user()` Trigger-Funktion updaten: auch `email` aus `NEW.email` speichern
- Backfill: bestehende Profiles mit E-Mail aus `auth.users` befüllen
- **RLS-Fix**: Admin-SELECT-Policy auf `sms_spoof_logs` ändern — Admin soll ALLE Logs sehen (nicht nur `created_by = auth.uid()`)

### 2. Edge Function `send-sms`
- Neuen Parameter `branding_id` akzeptieren und in `sms_logs` speichern

### 3. Client `sendSms` + alle Aufrufstellen
- `SendSmsParams` um `branding_id` erweitern
- Alle ~10 Aufrufstellen (AdminBewerbungen, AdminBewerbungsgespraeche, AdminBewertungen, AdminLivechat, AdminMitarbeiterDetail, AdminSmsTemplates, AssignmentDialog, AuftragDetails) anpassen: `branding_id` mitgeben

### 4. AdminSmsHistory.tsx
- Brandings-Liste laden
- **Seven.io Tab**: Spalte "Branding" mit Firmenname statt nur "Konto"
- **Spoof Tab**: Spalte "Konto" zeigt E-Mail-Adresse (aus profiles.email) statt "System"
- **Statistik-Breakdown**: pro Branding für seven.io, pro Nutzerkonto (mit E-Mail) für Spoof

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| Migration SQL | branding_id, email, RLS-Fix, backfill |
| `supabase/functions/send-sms/index.ts` | branding_id akzeptieren + speichern |
| `src/lib/sendSms.ts` | branding_id Parameter |
| `src/pages/admin/AdminSmsHistory.tsx` | Branding-Anzeige + E-Mail-Anzeige |
| ~8 Dateien mit sendSms-Aufrufen | branding_id mitgeben |

