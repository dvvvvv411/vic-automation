

## Plan: SMS Spoof History nach Branding speichern

### Problem
- Spoof-SMS werden aktuell mit `created_by` (User-ID) geloggt, aber `branding_id` wird nie gesetzt
- `/admin/sms-history` zeigt Spoof-Auswertung "pro Nutzerkonto" statt "pro Branding"
- Queries filtern nicht nach `activeBrandingId`
- Indeed-Auto-Spoof sendet kein `brandingId` mit

### Aenderungen

**1. Edge Function `sms-spoof/index.ts`**
- Neuen Parameter `brandingId` aus dem Request-Body lesen
- Beim Insert in `sms_spoof_logs` als `branding_id` speichern

**2. `AdminSmsSpoof.tsx`**
- `useBrandingFilter()` importieren
- Bei manuellem Senden (`handleSend`): `brandingId: activeBrandingId` mitsenden
- Bei Template-Senden (`handleConfirmSend`): `brandingId: activeBrandingId` mitsenden
- Logs-Query und Templates-Query nach `activeBrandingId` filtern

**3. `AdminBewerbungen.tsx`**
- Beim Indeed-Auto-Spoof (Zeile 262-270): `brandingId: app.branding_id` mitsenden

**4. `AdminSmsHistory.tsx`**
- Spoof-Logs Query: `.eq("branding_id", activeBrandingId)` Filter hinzufuegen
- seven.io Logs Query: `.eq("branding_id", activeBrandingId)` Filter hinzufuegen
- "Spoof pro Nutzerkonto" Card umbauen zu "Spoof pro Branding" mit `branding_id` statt `created_by`
- Spoof-Tabelle: "Konto"-Spalte ersetzen durch "Branding"-Spalte

### Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/sms-spoof/index.ts` | `brandingId` Parameter annehmen und in Log speichern |
| `src/pages/admin/AdminSmsSpoof.tsx` | `activeBrandingId` mitsenden bei allen Send-Aktionen |
| `src/pages/admin/AdminBewerbungen.tsx` | `brandingId: app.branding_id` bei Indeed-Spoof mitsenden |
| `src/pages/admin/AdminSmsHistory.tsx` | Queries nach Branding filtern, Breakdown-Card auf Branding umstellen |

Keine DB-Migration noetig — `sms_spoof_logs.branding_id` existiert bereits.

