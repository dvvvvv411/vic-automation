
## Plan: "Alle fehlgeschlagenen SMS erneut senden" Button

### Änderung

**Datei:** `src/pages/admin/AdminSmsHistory.tsx`

1. Neuer State `retryingAll` (boolean) für den Bulk-Retry-Prozess
2. `handleRetryAll` Funktion: Filtert alle `smsLogs` mit `status === "failed"`, iteriert sequentiell mit `for...of`, ruft pro Eintrag `sendSms` auf und updated den DB-Status bei Erfolg. Am Ende `invalidateQueries` + Toast mit Ergebnis (z.B. "5/7 SMS erfolgreich nachgesendet").
3. Button neben dem Monats-Selector im Header-Bereich, nur sichtbar wenn `failedCount > 0`. Icon: `RefreshCw` mit `animate-spin` während `retryingAll`. Label: "Alle fehlgeschlagenen erneut senden ({failedCount})"
4. `failedCount` als `useMemo` aus `smsLogs?.filter(l => l.status === "failed").length`

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminSmsHistory.tsx` | State, Handler, Button + failedCount Memo |
