

## Plan: Terminbestaetigung per Email & SMS

### Aenderungen

Beide oeffentlichen Buchungsseiten (`Bewerbungsgespraech.tsx` und `Probetag.tsx`) senden nach erfolgreicher Buchung eine Bestaetigungs-Email und -SMS an den Bewerber.

**1. `src/pages/Bewerbungsgespraech.tsx`**
- `sendEmail` und `sendSms` importieren
- In `bookMutation.mutationFn` nach dem Telegram-Aufruf:
  - `sendEmail` mit event_type `gespraech_bestaetigung`, Betreff "Ihr Bewerbungsgespraech am {datum}", Body mit Datum + Uhrzeit, branding_id
  - `sendSms` mit event_type `gespraech_bestaetigung`, Text mit Name/Datum/Uhrzeit, branding_id
- Beide Aufrufe nur wenn `application.email` bzw. `application.phone` vorhanden

**2. `src/pages/Probetag.tsx`**
- Analog: `sendEmail` mit event_type `probetag_bestaetigung` und `sendSms` mit event_type `probetag_bestaetigung`
- Gleiche Logik: nur senden wenn Email/Phone vorhanden

**3. `src/pages/admin/AdminEmails.tsx`**
- Zwei neue Preview-Templates hinzufuegen: `gespraech_bestaetigung` und `probetag_bestaetigung`

**4. `src/pages/admin/AdminSmsTemplates.tsx`**
- `PLACEHOLDER_INFO` erweitern um `gespraech_bestaetigung: ["{name}", "{datum}", "{uhrzeit}"]` und `probetag_bestaetigung: ["{name}", "{datum}", "{uhrzeit}"]`

**Hinweis:** Die Buchungsseiten sind oeffentlich (anon-User). `sendEmail` und `sendSms` rufen Edge Functions auf, die mit dem Service-Role-Key arbeiten — das funktioniert auch ohne Auth-Session, da die Edge Functions `verify_jwt = false` haben.

### Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/Bewerbungsgespraech.tsx` | Email + SMS nach Buchung senden |
| `src/pages/Probetag.tsx` | Email + SMS nach Buchung senden |
| `src/pages/admin/AdminEmails.tsx` | Preview-Templates fuer beide Bestaetigungen |
| `src/pages/admin/AdminSmsTemplates.tsx` | Platzhalter-Info fuer beide Events |

