

## Logo im E-Mail-Header statt Unternehmensname

### Umsetzung

**1. Datenbank-Migration**: Zwei neue Spalten in `brandings`:
- `email_logo_enabled` (boolean, default false)
- `email_logo_url` (text, nullable)

**2. AdminBrandingForm.tsx**: Unter dem Logo-Upload einen neuen Abschnitt einfügen:
- Switch/Toggle "Logo im E-Mail-Header anzeigen" (statt Unternehmensname)
- Wenn aktiviert: Eingabefeld für die Bild-URL
- Neue Felder `email_logo_enabled` und `email_logo_url` im Formular-State und Schema ergänzen, mitspeichern

**3. send-email Edge Function**: Die `logoHtml`-Zeile anpassen:
- Wenn `email_logo_enabled` true und `email_logo_url` gesetzt: `<img>` mit der URL und `alt="${companyName}"` rendern
- Sonst: wie bisher den Unternehmensnamen als Text

**4. E-Mail-Vorschau** (`AdminEmails.tsx`): Falls die Vorschau den Header rendert, dort ebenfalls die Logo-Logik einbauen.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| Migration | `email_logo_enabled` + `email_logo_url` Spalten |
| `src/pages/admin/AdminBrandingForm.tsx` | Toggle + URL-Eingabefeld |
| `supabase/functions/send-email/index.ts` | Logo-Bild statt Text im Header |
| `src/pages/admin/AdminEmails.tsx` | Vorschau-Header anpassen (falls nötig) |

