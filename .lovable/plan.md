

## Plan: Retry-Button fuer fehlgeschlagene SMS in SMS-History

### Uebersicht

In der seven.io SMS-Tabelle bei `/admin/sms-history` wird bei `status === "failed"` ein Retry-Button angezeigt. Bei Klick wird die SMS erneut ueber `send-sms` gesendet. Bei Erfolg wird der `sms_logs`-Eintrag auf `status = "sent"` aktualisiert.

### Aenderungen

**1. DB-Migration: UPDATE Policy auf `sms_logs` fuer admin und kunde**

```sql
CREATE POLICY "Admin and kunde can update sms_logs"
ON public.sms_logs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_kunde(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.is_kunde(auth.uid())
);
```

**2. `AdminSmsHistory.tsx`**

- Import `RefreshCw` Icon und `sendSms` aus `@/lib/sendSms`
- Import `toast` und `useQueryClient`
- Neue Spalte "Aktion" in der seven.io Tabelle
- Bei `log.status === "failed"`: Button mit RefreshCw-Icon
- onClick-Handler:
  1. `sendSms({ to: log.recipient_phone, text: log.message, event_type: log.event_type, recipient_name: log.recipient_name, from: sender, branding_id: log.branding_id })`
  2. Bei Erfolg: `supabase.from("sms_logs").update({ status: "sent", error_message: null }).eq("id", log.id)`
  3. Query-Cache invalidieren
  4. Toast-Nachricht

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | UPDATE Policy auf `sms_logs` fuer admin + kunde |
| `AdminSmsHistory.tsx` | Retry-Button bei failed SMS, Status-Update bei Erfolg |

