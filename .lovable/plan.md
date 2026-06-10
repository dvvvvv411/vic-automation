## Änderung

Alle `bewerbung_angenommen*` SMS-Templates (außer `indeed_bewerbung_angenommen`) auf folgenden Text setzen:

> Hallo {name}, Ihre Bewerbung als Prozesstester/in wurde angenommen! Buchen Sie jetzt ein kurzes Kennenlerngespräch: {link}

### Betroffene Templates (DB-Update auf `sms_templates`)

1. `bewerbung_angenommen` — neuer Text (vorher ohne "als Prozesstester/in")
2. `bewerbung_angenommen_extern_meta` — neuer Text (vorher Instagram/Facebook-Variante ohne Link)

`indeed_bewerbung_angenommen` bleibt unverändert.

### Code-Update

In `src/pages/admin/AdminSmsTemplates.tsx`:
- `bewerbung_angenommen_extern_meta` Platzhalter-Info erweitern: `["{name}"]` → `["{name}", "{link}"]`

Keine weiteren Code-Änderungen nötig — `{link}` wird in `AdminBewerbungen.tsx` bereits durch Shortlink ersetzt.