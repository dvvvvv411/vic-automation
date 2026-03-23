

## Plan: Email statt UUID bei Kunden anzeigen

### Aenderung

**`AdminKunden.tsx`** — In der Query (Zeile 37-46):

- `profiles` Select erweitern: `"id, full_name, display_name, email"`
- Fallback-Kette aendern: `profile?.email || profile?.display_name || profile?.full_name || uid`

So wird die Account-Email als Name angezeigt wenn kein Display-Name gesetzt ist, statt der UUID.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminKunden.tsx` | Email aus profiles laden und als primaeren Anzeigenamen verwenden |

