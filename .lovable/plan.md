

## Plan: Favicon pro Branding

### 1. DB-Migration: `favicon_url` Spalte

Neue Spalte `favicon_url text` in `brandings` Tabelle.

### 2. `AdminBrandingForm.tsx`: Favicon-Upload

- Neuer State `faviconFile` analog zu `logoFile`
- Neues Upload-Feld im Stammdaten-Bereich (nach Logo, vor E-Mail Logo)
- Label "Favicon", accept `image/png,image/x-icon,image/svg+xml`
- Vorschau des aktuellen Favicons wenn vorhanden
- Upload nach `branding-logos` Bucket, URL als `favicon_url` speichern

### 3. Favicon sofort laden: Inline-Script in `index.html`

Ein kleines Inline-Script VOR dem React-Bundle, das:
- Den aktuellen Hostname nimmt
- Per `fetch` die Supabase REST API aufruft: `GET /rest/v1/brandings?domain=eq.{hostname}&select=favicon_url`
- Falls `favicon_url` vorhanden: das `<link rel="icon">` Element im DOM aktualisiert
- Falls nicht: Standard-Favicon `/favicon.png` bleibt

Das laeuft synchron vor React und setzt das Favicon ohne sichtbare Verzoegerung.

### 4. React-seitig: Favicon bei Branding-Wechsel aktualisieren

In `BrandingContext.tsx` oder `AdminLayout.tsx`: Wenn das aktive Branding ein `favicon_url` hat, wird `document.querySelector('link[rel="icon"]').href` aktualisiert. So wechselt auch im Admin-Bereich das Favicon mit dem Branding-Switcher.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | `favicon_url` Spalte |
| `index.html` | Inline-Script fuer sofortiges Favicon |
| `AdminBrandingForm.tsx` | Favicon-Upload-Feld |
| `BrandingContext.tsx` | Favicon bei Branding-Wechsel setzen |

