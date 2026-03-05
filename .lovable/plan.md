

# Fix: SMS Spoof Edge Function -- Headers und URL anpassen

## Problem
Die Edge Function sendet an `https://api.nigga.life/api/sms/send` mit minimalen Headers. Das funktionierende Python-Beispiel zeigt:
- URL ist `https://nigga.life/api/sms/send` (ohne `api.` Subdomain)
- Browser-ähnliche Headers sind nötig (origin, referer, user-agent, etc.)

## Änderungen

**Datei: `supabase/functions/sms-spoof/index.ts`**

Den SMS-Send-Block anpassen:
1. URL von `https://api.nigga.life/api/sms/send` zu `https://nigga.life/api/sms/send` ändern
2. Alle Headers aus dem Python-Beispiel übernehmen (accept, origin, referer, user-agent, sec-ch-ua, etc.)

Danach Edge Function neu deployen.

