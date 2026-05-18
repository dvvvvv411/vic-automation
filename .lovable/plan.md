# Fix: Branding-Favicon wird nicht geladen

## Problem
Der Inline-Script in `index.html` (der beim ersten Seitenaufruf das Favicon anhand der Domain aus Supabase lädt) zeigt noch auf das **alte, gelöschte** Supabase-Projekt:

```
SB_URL = "https://luorlnagxpsibarcygjm.supabase.co"
SB_KEY = "...luorlnagxpsibarcygjm..."
```

Dadurch schlägt jeder Favicon-Request still fehl → es wird immer nur `/favicon.png` angezeigt, nie das im Branding hinterlegte Favicon.

## Fix
In `index.html` die Werte für `SB_URL` und `SB_KEY` auf das aktuelle Projekt umstellen — identisch zu `src/integrations/supabase/client.ts`:

- `SB_URL` → `https://laozvnaupdecerpvwzmh.supabase.co`
- `SB_KEY` → aktueller anon key (`eyJhbGciOiJIUzI1NiIs...laozvnaupdecerpvwzmh...`)

Keine weitere Logik-Änderung nötig. Der Rest des Scripts (Domain-Parsing, Fetch auf `brandings?domain=eq.…&select=favicon_url`, Setzen des `<link id="app-favicon">`) bleibt unverändert.

## Ergebnis
Beim Aufruf einer Branding-Domain (z. B. `web.frik-maxeiner.de`) wird das im Branding gespeicherte `favicon_url` direkt im Browser-Tab angezeigt — sowohl auf öffentlichen Seiten als auch im eingeloggten Bereich (bis `BrandingContext` ggf. überschreibt).
