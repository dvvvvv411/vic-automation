## Ziel
Pro Branding kann optional ein „Custom Email Link“ hinterlegt werden (z. B. `for-tel.com`). Wenn aktiv, sollen Email-Button-Links nicht mehr aus Subdomain-Prefix + Domain gebaut werden, sondern aus diesem Custom Link. Der Pfad bleibt bei allen normalen Email-Buttons erhalten.

Wichtig für „Gespräch erfolgreich“: Der Button „Vertragsdaten einreichen“ soll keinen Pfad bekommen. Er führt direkt auf die Basis-URL des Brandings:
- Wenn Custom Email Link aktiv: `https://for-tel.com`
- Wenn nicht aktiv: bisherige Branding-Basis, z. B. `https://prefix.domain.de`

## Änderungen

### 1) Datenbank
In `brandings` werden zwei Felder ergänzt:
- `custom_email_link_enabled boolean NOT NULL DEFAULT false`
- `custom_email_link text`

Keine RLS-Änderung nötig, da bestehende Branding-Policies weiter greifen.

### 2) Branding-Formular `/admin/brandings` hinzufügen/bearbeiten
In `src/pages/admin/AdminBrandingForm.tsx`:
- Toggle „Custom Email Links“ hinzufügen.
- Wenn aktiv: Eingabefeld „Custom Email Link“ anzeigen, Placeholder z. B. `for-tel.com`.
- Werte beim Bearbeiten laden und beim Speichern mitschicken.
- Hinweis: Der Custom Link wird nur für Links in Email-Buttons verwendet.

### 3) URL-Builder für Email-Buttons
In `src/lib/buildBrandingUrl.ts`:
- `custom_email_link_enabled` und `custom_email_link` mitladen.
- Wenn aktiv und Link gesetzt: `https://{custom_email_link}{path}` zurückgeben.
- Sonst bisher: `https://{subdomain_prefix}.{domain}{path}`.
- Der Pfad bleibt unverändert, außer wenn explizit `""` übergeben wird.

### 4) Edge Function für automatische Bewerbungsannahme
In `supabase/functions/submit-application/index.ts`:
- Die gleiche Custom-Link-Logik für den Bewerbungs­gespräch-Button verwenden.
- Beispiel: Custom Link `for-tel.com` + Pfad `/bewerbungsgespraech/{id}` ergibt `https://for-tel.com/bewerbungsgespraech/{id}`.

### 5) „Gespräch erfolgreich“-Email richtig anpassen
In `src/pages/admin/AdminBewerbungsgespraeche.tsx`:
- Beim Markieren als erfolgreich wird für den Button `buildBrandingUrl(brandingId, "")` verwendet.
- Beim erneuten Senden ebenfalls `buildBrandingUrl(brandingId, "")`.
- Ergebnis:
  - Custom Link aktiv: `https://for-tel.com`
  - Custom Link nicht aktiv: `https://prefix.domain.de`
- Button-Text bleibt „Vertragsdaten einreichen“.
- Kein `/arbeitsvertrag/...`, kein anderer Pfad.

### 6) Email-Vorschau `/admin/emails`
In `src/pages/admin/AdminEmails.tsx`:
- Brandings-Query lädt `custom_email_link_enabled`, `custom_email_link`, `domain`, `subdomain_prefix` mit.
- Für die Vorschau der „Gespräch erfolgreich“-Mail wird die Button-URL dynamisch aus dem ausgewählten Branding gebaut:
  - Custom aktiv: `https://{custom_email_link}`
  - Sonst: `https://{subdomain_prefix}.{domain}`
- Wenn kein Branding ausgewählt ist, bleibt ein neutraler Fallback möglich.
- Keine feste `example.com`-URL für diese Mail, sobald ein Branding ausgewählt ist.

## Nicht geändert
- Andere Emails behalten ihren jeweiligen Pfad und verwenden automatisch Custom Link + Pfad, wenn aktiviert.
- Die öffentliche Routenlogik bleibt unverändert.
- Keine Änderungen an Email-Templates außerhalb der Link-Generierung.