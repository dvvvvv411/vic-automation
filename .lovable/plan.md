

## SMS fuer externe Bewerber: Link entfernen, Hinweis auf Email

### Problem
Die externe SMS nutzt noch das `bewerbung_angenommen` Template mit `{link}`. Stattdessen soll ein eigenes Template ohne Link verwendet werden, mit Hinweis dass der Termin ueber den Link in der Email gebucht werden soll.

### Aenderungen

**1. DB-Migration: Neues SMS-Template einfuegen**
- `event_type: 'bewerbung_angenommen_extern'`
- `label: 'Bewerbung angenommen (Extern)'`
- `message: 'Hallo {name}, Ihre Bewerbung ueber Instagram/Facebook als {jobtitel} wurde angenommen! Bitte buchen Sie Ihren Termin ueber den Link in der Email, die Sie erhalten haben.'`
- Kein `{link}` Platzhalter

**2. `AdminBewerbungen.tsx` — Zeile 303-317**
- Template laden aus `bewerbung_angenommen_extern` statt `bewerbung_angenommen`
- Platzhalter-Ersetzung: `{name}` und `{jobtitel}` (kein `{link}`)
- `event_type` auf `"bewerbung_angenommen_extern"` aendern
- Fallback-Text ohne Link, mit Hinweis auf Email

**3. `AdminSmsTemplates.tsx` — PLACEHOLDER_INFO**
- Neuer Eintrag: `bewerbung_angenommen_extern: ["{name}", "{jobtitel}"]`

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration | INSERT neues SMS-Template |
| `AdminBewerbungen.tsx` | Eigenes Template + kein Link |
| `AdminSmsTemplates.tsx` | Platzhalter-Info ohne {link} |

