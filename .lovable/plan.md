

## Plan: Spoof Credits, Kunden-Zugriff auf SMS History, Pagination

### 1. DB-Migration

- `ALTER TABLE brandings ADD COLUMN spoof_credits integer DEFAULT NULL`
- RLS-Policies fuer `sms_logs` und `sms_spoof_logs`: SELECT-Policy fuer Kunden hinzufuegen (`branding_id IN (SELECT user_branding_ids(auth.uid()))`)

### 2. AdminBrandingForm: Spoof Credits Feld

- Schema um `spoof_credits` (optionaler String) erweitern
- Neues Input-Feld "Spoof Credits" (type number) im Stammdaten-Bereich
- In `saveMutation` als numeric behandeln

### 3. Edge Function `sms-spoof`: Credits abziehen

- Nach erfolgreichem SMS-Versand: `UPDATE brandings SET spoof_credits = spoof_credits - 1 WHERE id = brandingId AND spoof_credits IS NOT NULL`
- **Kein Limiter** — auch bei 0 oder negativem Stand wird weiterhin gesendet, der Wert geht ins Minus

### 4. AdminSmsHistory: Credits-Card + Pagination

- Branding-Query erweitern um `spoof_credits` fuer aktives Branding
- Neue 4. Stats-Card "Spoof Credits" — zeigt aktuelle Zahl (auch negativ), `null` = "Unbegrenzt"
- Pagination: State `smsLimit`/`spoofLimit` (initial 10), `slice(0, limit)`, "Mehr anzeigen" Button (+10)

### 5. Kunden-Zugriff auf SMS History

- `AdminLayout.tsx`: `/admin/sms-history` aus `KUNDE_BLOCKED_PATHS` entfernen
- `AdminSidebar.tsx`: `/admin/sms-history` aus `KUNDE_HIDDEN_PATHS` entfernen

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | `spoof_credits` Spalte + RLS fuer sms_logs/sms_spoof_logs |
| `AdminBrandingForm.tsx` | Spoof Credits Input |
| `sms-spoof/index.ts` | Credits nach Versand abziehen (kein Block) |
| `AdminSmsHistory.tsx` | Credits-Card + Pagination |
| `AdminLayout.tsx` | sms-history aus KUNDE_BLOCKED_PATHS entfernen |
| `AdminSidebar.tsx` | sms-history aus KUNDE_HIDDEN_PATHS entfernen |

