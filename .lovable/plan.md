## Ziel
META-Bewerber (Instagram/Facebook) sollen beim Annehmen dieselbe Annahme-SMS bekommen wie normale Bewerber — mit dem Bewerbungsgespräch-Buchungslink, versendet über Seven.io (Standard `sendSms`).

## Problem
In `src/pages/admin/AdminBewerbungen.tsx` nutzt der META-Zweig (Zeilen 292–326 sowie der zweite Pfad ab 491–505):
- Template `bewerbung_angenommen_extern_meta` (ersetzt nur `{name}`, kein `{link}`)
- Fallback-Text ohne Link ("…Bitte buche deinen Termin über den Link in der E-Mail.")
- Es wird kein Short-Link erzeugt

## Lösung
Im META-Zweig analog zum Normal-Zweig:
1. `shortLink = await createShortLink(interviewLink, app.branding_id)` erzeugen
2. Template-Replace um `{link}` ergänzen
3. Fallback-Text auf `"Hallo {name}, Ihre Bewerbung wurde angenommen! Termin buchen: {shortLink}"` ändern
4. `sendSms` bleibt unverändert (geht bereits über Seven.io)

Beides an zwei Stellen anpassen:
- Einzel-Annahme-Mutation (~Z. 311–326)
- Bulk/zweite Annahme-Funktion (~Z. 491–505)

E-Mail bleibt unverändert (enthält bereits Button mit Link).

## Optional / Rückfrage
Soll der **Event-Type** `bewerbung_angenommen_extern_meta` bleiben (für separates Tracking & eigenes Template in der Admin-SMS-Vorlagen-Verwaltung), oder lieber komplett auf `bewerbung_angenommen` umstellen?

Empfehlung: Event-Type beibehalten, nur Inhalt um Link erweitern — so bleibt die Trennung in den SMS-Logs erhalten.

## Keine Änderungen an
- DB-Schema
- `send-sms` Edge Function
- Indeed-Spoof-Logik
- Extern (Allgemein) — falls dort dasselbe Problem besteht, separate Entscheidung nötig (aktuell auch ohne `{link}`)
