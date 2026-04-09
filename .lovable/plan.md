

## Plan: Automatische Spoof-SMS korrekt als "auto" markieren

### Problem
Die Migration hat alle bestehenden 208 Spoof-Logs als `source = 'manual'` markiert. Davon sind aber 167 automatisch generierte SMS (Bewerbung angenommen), die den Text "Deine Bewerbung bei ... war erfolgreich" enthalten. Diese werden fälschlicherweise im Verlauf der Spoof-Seite angezeigt.

### Lösung
Eine Migration die alle Logs mit dem Bewerbungs-Muster auf `source = 'auto'` setzt:

```sql
UPDATE sms_spoof_logs 
SET source = 'auto' 
WHERE message LIKE '%Deine Bewerbung bei%war erfolgreich%';
```

Das trifft die 167 automatisch generierten SMS. Die restlichen 41 (manuelle Tests, Template-Versand etc.) bleiben `manual`.

### Betroffene Ressourcen

| Resource | Änderung |
|---|---|
| DB: `sms_spoof_logs` | 167 Zeilen: `source` → 'auto' |

Keine Code-Änderungen nötig — der Filter in `fetchLogs` funktioniert bereits korrekt.

