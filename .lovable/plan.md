

## Eigene SMS fuer externe Bewerber

### Ziel
Externe Bewerber (is_external) sollen beim Akzeptieren eine eigene SMS erhalten, die Instagram/Facebook und den Jobtitel erwaehnt — analog zur bereits existierenden externen Email.

### Aenderungen

**1. `AdminBewerbungen.tsx` — Zeile 303-317 (is_external SMS-Block)**
- Statt `bewerbung_angenommen` Template das neue `bewerbung_angenommen_extern` Template laden
- `mainJobTitle` ist bereits geladen (Zeile 276-283) — in der SMS-Ersetzung `{jobtitel}` und `{unternehmen}` als Platzhalter verwenden
- `event_type` auf `"bewerbung_angenommen_extern"` aendern
- Fallback-Text: `Hallo {name}, Ihre Bewerbung ueber Instagram/Facebook als {jobtitel} wurde angenommen! Termin buchen: {link}`

**2. `AdminSmsTemplates.tsx` — PLACEHOLDER_INFO (Zeile 26-28)**
- Neuen Eintrag hinzufuegen: `bewerbung_angenommen_extern: ["{name}", "{jobtitel}", "{link}"]`

**3. DB: Neues SMS-Template einfuegen**
- Migration: `INSERT INTO sms_templates` mit `event_type: 'bewerbung_angenommen_extern'`, `label: 'Bewerbung angenommen (Extern)'`, `message: 'Hallo {name}, Ihre Bewerbung ueber Instagram/Facebook als {jobtitel} wurde angenommen! Termin buchen: {link}'`

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration | Neues SMS-Template Row |
| `AdminBewerbungen.tsx` | Eigenes Template + event_type fuer externe SMS |
| `AdminSmsTemplates.tsx` | Platzhalter-Info fuer neues Template |

