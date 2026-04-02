

## Plan: Alle fehlgeschlagenen SMS löschen

### Aktion

Eine SQL-Migration die alle Einträge mit `status = 'failed'` aus der `sms_logs` Tabelle löscht.

```sql
DELETE FROM sms_logs WHERE status = 'failed';
```

**Betroffen:** 553 Einträge werden gelöscht.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| Neue SQL-Migration | `DELETE FROM sms_logs WHERE status = 'failed'` |

