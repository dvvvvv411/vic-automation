

# Logo aus E-Mails entfernen, nur Firmenname als Text

## Problem

CID-Embedding funktioniert nicht zuverlässig in allen E-Mail-Clients. Das Logo wird nicht korrekt angezeigt.

## Lösung

Die gesamte Logo-Logik aus der Edge Function entfernen. Im E-Mail-Header wird immer nur der Firmenname als weißer Text auf der Branding-Farbe angezeigt – so wie es jetzt schon als Fallback funktioniert, wenn kein Logo vorhanden ist.

## Änderungen in `supabase/functions/send-email/index.ts`

1. **`fetchLogo`-Funktion komplett löschen** (Zeilen 22-37)
2. **`buildEmailHtml`**: Parameter `hasLogo` entfernen, Logo-HTML immer als Text-Span rendern:
   ```html
   <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${companyName}</span>
   ```
3. **Logo-Fetch und Attachment-Logik entfernen**: `logoData`-Variable, `fetchLogo()`-Aufruf und `resendPayload.attachments` komplett entfernen

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `supabase/functions/send-email/index.ts` | fetchLogo löschen, hasLogo entfernen, Attachments entfernen |

