# Fix: Public Pages laden unendlich

## Problem

Alle öffentlichen Seiten (`/erster-arbeitstag/:id`, `/probetag/:id`, `/arbeitsvertrag/:id`, `/bewerbungsgespraech/:id`, `/bewerbungsgespraech/buchen`, `/r/:code`) hängen im Ladezustand – egal ob eingeloggt oder anonym.

## Ursache

`src/integrations/supabase/publicClient.ts` zeigt noch auf das **alte, gelöschte Supabase-Projekt**:

- Falsch (publicClient): `https://luorlnagxpsibarcygjm.supabase.co`
- Richtig (client):     `https://laozvnaupdecerpvwzmh.supabase.co`

Alle Anfragen der öffentlichen Seiten gehen damit ins Leere und timeouten still – React Query bleibt in `loading`.

## Fix

`publicClient.ts` auf die aktuelle Supabase-URL + Anon-Key updaten (gleiche Werte wie `client.ts`, nur ohne Session-Persistenz).

```ts
const SUPABASE_URL = "https://laozvnaupdecerpvwzmh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "<aktueller anon key aus client.ts>";
```

Keine weiteren Code-Änderungen nötig – Logik der Seiten bleibt unverändert.

## Verifikation

Nach dem Fix `/erster-arbeitstag/9b35c4a1-...` öffnen → Daten laden, Kalender erscheint.
