

# SMS History -- Admin-only Übersichtsseite

## Übersicht
Neuer Reiter "SMS History" im Admin-Panel (nur für Admins sichtbar, nicht für Kunden). Zeigt eine kombinierte Übersicht aller versendeten SMS (seven.io + Spoof) mit Statistiken pro Monat und pro Nutzerkonto.

## Datengrundlage
- **sms_spoof_logs**: Hat `created_by` Spalte -- kann Nutzer zugeordnet werden
- **sms_logs**: Hat **keine** `created_by` Spalte -- muss per Migration ergänzt werden, damit man nachvollziehen kann wer die SMS ausgelöst hat

## Änderungen

### 1. DB-Migration: `created_by` zu `sms_logs` hinzufügen
```sql
ALTER TABLE sms_logs ADD COLUMN created_by uuid;
```
Damit zukünftige SMS dem auslösenden Nutzer zugeordnet werden können.

### 2. Edge Function `send-sms` anpassen
Authorization-Header auslesen und `created_by` beim Insert in `sms_logs` setzen (wie bei `sms-spoof` bereits gemacht).

### 3. Neue Seite: `src/pages/admin/AdminSmsHistory.tsx`
**Layout:**
- **Statistik-Cards oben**: Gesamtzahl SMS diesen Monat, davon Spoof vs. seven.io, Aufschlüsselung nach Nutzerkonto
- **Monatsfilter**: Dropdown/Picker für Monat+Jahr
- **Zwei Tabs**: "Spoof SMS" und "seven.io SMS"
- **Tabellen** mit: Datum, Empfänger, Absender, Nachricht (gekürzt), Status, Nutzerkonto (E-Mail)

Die Seite nutzt `supabase.rpc` oder direkte Queries mit Joins auf `auth.users` via `profiles` um die E-Mail des Senders anzuzeigen.

### 4. Routing + Sidebar
- Route: `/admin/sms-history`
- Sidebar-Eintrag unter "Betrieb" mit `History`-Icon
- `KUNDE_HIDDEN_PATHS` in AdminLayout + AdminSidebar erweitern um `/admin/sms-history`

### 5. RLS
`sms_logs` hat bereits eine Admin-only SELECT Policy. Für die neue `created_by`-Spalte ist keine RLS-Änderung nötig.

## Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| Migration SQL | `created_by` Spalte zu `sms_logs` |
| `supabase/functions/send-sms/index.ts` | Auth-Header parsen, `created_by` setzen |
| `src/pages/admin/AdminSmsHistory.tsx` | Neue Seite (Statistik + Tabellen) |
| `src/App.tsx` | Route hinzufügen |
| `src/components/admin/AdminSidebar.tsx` | Nav-Eintrag + KUNDE_HIDDEN |
| `src/components/admin/AdminLayout.tsx` | KUNDE_BLOCKED_PATHS erweitern |

