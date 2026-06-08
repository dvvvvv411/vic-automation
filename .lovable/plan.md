## Problem
In der E-Mail „Ihre Bewerbung wurde angenommen“ wird im Footer `Schauen Sie sich noch einmal die Stellenanzeige an: https://{domain}/karriere` immer mit der Standard-Domain (`brandings.domain`) gebaut. Ist für ein Branding ein **Custom Email Link** hinterlegt und aktiv (`custom_email_link_enabled = true`, `custom_email_link` gesetzt), soll dieser stattdessen verwendet werden.

## Betroffene Stellen
1. `src/pages/admin/AdminBewerbungen.tsx`
   - `acceptMutation` (Zeilen ~230–244): Karriere-Link bauen.
   - Zweite identische Stelle (Zeilen ~459–470).
2. `supabase/functions/submit-application/index.ts` (Zeilen ~183–209): beim `auto_accept`-Flow gleiche Logik.

## Änderung
Beim Laden des Brandings zusätzlich `custom_email_link_enabled, custom_email_link` selektieren und folgende Priorität verwenden:

```
if custom_email_link_enabled && custom_email_link:
    careerLink = `https://{custom_email_link bereinigt}/karriere`
else if domain:
    careerLink = `https://{domain ohne web. Präfix}/karriere`
```

Bereinigung wie bisher: `^https?://` und trailing `/` entfernen. Bei der Standard-Domain bleibt `web.` weiterhin entfernt (Memory-Regel). Beim Custom-Link wird kein Präfix entfernt — er wird so genommen, wie der Kunde ihn hinterlegt hat.

Footer-Text und HTML-Format bleiben unverändert.

## Keine weiteren Änderungen
- Kein Schema-Update nötig (Felder existieren).
- Keine UI-Änderung in `AdminBrandingForm` oder `AdminEmails` (Vorschau ist statisches Beispiel).
- Edge Function `submit-application` muss nach der Änderung neu deployed werden.
