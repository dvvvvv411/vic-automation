### Ziel
Bei allen "Bewerbung angenommen" E-Mail-Templates soll **niemals** ein Logo im Header angezeigt werden — stattdessen immer der Unternehmensname als Text. Alle anderen Templates behalten die bestehende Logo-Logik bei.

### Betroffene Templates (event_type)
- `bewerbung_angenommen`
- `bewerbung_angenommen_extern_meta`
- `bewerbung_angenommen_extern`

### Änderungen

#### 1) Edge Function: `supabase/functions/send-email/index.ts`
Vor dem Aufruf von `buildEmailHtml` prüfen, ob `event_type` einer der drei "Bewerbung angenommen"-Typen ist. Wenn ja, `emailLogoEnabled` auf `false` und `emailLogoUrl` auf `undefined` setzen, unabhängig von den Branding-Einstellungen.

#### 2) Admin E-Mail-Vorschau: `src/pages/admin/AdminEmails.tsx`
Im `useMemo` für die HTML-Vorschau dieselbe Logik anwenden: Wenn `tpl.eventType` mit `bewerbung_angenommen` beginnt, Logo-Parameter auf `false`/`undefined` setzen, sodass die Vorschau das tatsächliche Versandverhalten abbildet.

### Nicht betroffen
- Andere E-Mail-Templates
- Branding-Einstellungen (nur die Abfrage wird beim Versand überschrieben)
- Datenbank