

# Fix: SMS Spoof Edge Function erneut deployen

## Problem
Die Edge Function `sms-spoof` gibt weiterhin 404 zurueck (`{"detail":"Not Found"}`). Die Logs zeigen zwar Boot-Events, aber die Funktion ist offenbar nicht korrekt erreichbar.

## Loesung
Edge Function `sms-spoof` erneut deployen. Kein Code muss geaendert werden -- die Implementierung ist korrekt und entspricht der API-Dokumentation.

| Aktion | Detail |
|---|---|
| Redeploy `sms-spoof` | Edge Function erneut deployen |

