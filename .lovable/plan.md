

## Problem: Favicon laedt nicht auf dashboard.efficient-flow.solutions

### Ursache

Das Inline-Script in `index.html` entfernt nur den `web.`-Prefix vom Hostname. Wenn die Seite ueber `dashboard.efficient-flow.solutions` aufgerufen wird, bleibt der Hostname `dashboard.efficient-flow.solutions` — und die Supabase-Query `domain=eq.dashboard.efficient-flow.solutions` findet kein Branding (gespeichert als `efficient-flow.solutions`).

In `Auth.tsx` wird das korrekt geloest: bei 3+ Domain-Teilen wird der erste Teil entfernt (`dashboard.efficient-flow.solutions` → `efficient-flow.solutions`).

### Fix

**`index.html`** — Domain-Logik anpassen:

Statt `h.replace(/^web\./, '')` die gleiche Logik wie Auth.tsx verwenden:

```javascript
var parts = h.split(".");
var domain = parts.length > 2 ? parts.slice(-2).join(".") : h;
```

Das deckt `web.`, `dashboard.`, und alle anderen Subdomains ab.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `index.html` | Domain-Aufloesung: erstes Subdomain generisch entfernen statt nur `web.` |

