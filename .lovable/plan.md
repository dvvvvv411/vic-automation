## Ziel
Branding-Auflösung per Hostname soll zusätzlich `custom_email_link` matchen, damit User, die das Panel über den Custom-Link öffnen, das richtige Branding sehen.

## Logik (einheitlich überall)
1. Vollen Hostname holen: `host = window.location.hostname` (z.B. `panel.kunde.de`).
2. Reduzierten Root-Hostname bilden: `root = letzte 2 Teile` (wie bisher).
3. Lookup-Reihenfolge:
   a. `brandings` where `domain = root` → bisheriges Verhalten.
   b. Falls nichts gefunden: `brandings` where `custom_email_link_enabled = true` AND `custom_email_link` matched gegen `host` ODER `root` (normalisiert: ohne `https?://`, ohne trailing `/`, ohne führendes `www.`).
   c. Falls weiterhin nichts: bisheriger Fallback `frik-maxeiner.de`.

Da `custom_email_link` Freitext ist (z.B. `mein.custom.de` oder `app.kunde.com`), holen wir alle aktivierten Custom-Links in einem Query und vergleichen client-seitig (normalisiert). Das vermeidet komplexe SQL und bleibt einfach.

## Betroffene Dateien
1. **`src/pages/Auth.tsx`** (Zeilen 53–77): Branding-Fetch erweitern um Step 3b.
2. **`src/pages/BewerbungsgespraechPublic.tsx`** (Zeilen 35–58): Gleiche Erweiterung.

In beiden Dateien `select` um `custom_email_link_enabled, custom_email_link` ergänzen für den zweiten Query, der alle aktivierten Custom-Links lädt und matcht.

## Nicht betroffen
- `buildBrandingUrl.ts` (umgekehrte Richtung, bleibt wie ist).
- `AdminEmails.tsx`, `AdminBrandingForm.tsx`, DB, Edge Functions.
- Andere Seiten ohne Domain-Branding-Fetch.

## Technische Details
Helper inline (klein gehalten, kein neues lib-File nötig):
```ts
const norm = (s: string) => s.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase().trim();
```
Nach Step a (kein Treffer) → Query:
```ts
supabase.from("brandings")
  .select("id, logo_url, brand_color, domain, custom_email_link, custom_email_link_enabled")
  .eq("custom_email_link_enabled", true);
```
Dann finden: `rows.find(r => r.custom_email_link && [host, root].includes(norm(r.custom_email_link)))`.

Wird ein Treffer gefunden, werden `logo_url`, `brand_color`, `id`, `domain` (das echte DB-`domain`-Feld, damit z.B. das for.tel-Logo-Weiß-Filter weiter funktioniert) gesetzt.
