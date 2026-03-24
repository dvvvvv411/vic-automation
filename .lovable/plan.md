

## Plan: Auto-Accept Status und Link-Kopieren fixen

### Problem

1. Die Edge Function `submit-application` setzt bei `auto_accept=true` den Status auf `"akzeptiert"` — aber im Admin-Panel gibt es keinen Status `"akzeptiert"`, der korrekte Status ist `"bewerbungsgespraech"`
2. Der "Link kopieren"-Button wird nur bei Status `"bewerbungsgespraech"` angezeigt

### Aenderungen

**1. Edge Function `submit-application/index.ts`**

Status bei `auto_accept` von `"akzeptiert"` auf `"bewerbungsgespraech"` aendern:

```typescript
status: auto_accept ? "bewerbungsgespraech" : "neu",
```

Das ist der korrekte Status, da der Bewerber direkt zur Terminbuchung weitergeleitet wird — genau wie bei manueller Akzeptierung in `/admin/bewerbungen`.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/submit-application/index.ts` | Status `"akzeptiert"` → `"bewerbungsgespraech"` |

Der "Link kopieren"-Button funktioniert bereits fuer Status `"bewerbungsgespraech"` (Zeile 698-706), daher ist keine Frontend-Aenderung noetig.

