## Ziel
Beim Annehmen einer **Extern (Allgemein)** Bewerbung soll die SMS — analog zu Normal & META — den **Buchungslink (Short-Link)** enthalten.

## Aktuell
`src/pages/admin/AdminBewerbungen.tsx`, Zweig `app.is_external` (Z. 328–372 Einzelpfad, Z. 507–526 Bulk-Pfad):
- Kein `createShortLink` Call
- Template `bewerbung_angenommen_extern` ersetzt nur `{name}` und `{jobtitel}` — kein `{link}`
- Fallback-Text: „… buchen Sie Ihren Termin über den Link in der Email…"

## Änderung
Beide Stellen (Einzel + Bulk) im `is_external`-Zweig:
1. `const shortLink = await createShortLink(interviewLink, app.branding_id);` vor dem SMS-Block
2. Template-Replace um `.replace(/{link}/g, shortLink)` ergänzen
3. Fallback-Text: `Hallo ${app.first_name}, Ihre Bewerbung${mainJobTitle ? \` als ${mainJobTitle}\` : ""} wurde angenommen! Termin buchen: ${shortLink}`

E-Mail, Event-Type (`bewerbung_angenommen_extern`) und Sender bleiben unverändert.

## Hinweis
Damit unterstützt die DB-Vorlage `bewerbung_angenommen_extern` ab sofort die Platzhalter `{name}`, `{jobtitel}` **und** `{link}` — Vorlage ggf. in der Admin-SMS-Vorlagen-Verwaltung anpassen.
