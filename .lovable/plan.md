

## Plan: Bei auto_accept "Bewerbung angenommen" statt "Bewerbung eingegangen" senden

### Problem

Die `submit-application` Edge Function sendet bei `auto_accept=true` aktuell die "Bewerbung eingegangen" E-Mail (`event_type: "bewerbung_eingegangen"`). Stattdessen soll sie die "Bewerbung angenommen" E-Mail senden — mit denselben Parametern wie in `AdminBewerbungen.tsx` (Zeilen 242-258).

### Aenderung

**`supabase/functions/submit-application/index.ts`** (Zeilen 175-198)

Der E-Mail-Block wird per `if (auto_accept)` aufgeteilt:

**Bei `auto_accept === true`:**
- Branding-Domain laden (`domain`, `subdomain_prefix`) um Buchungs-URL zu bauen
- Karriere-Link bauen (`https://{domain}/karriere`)
- E-Mail mit denselben Parametern wie Admin-Panel senden:
  - `event_type`: `"bewerbung_angenommen"`
  - `subject`: `"Ihre Bewerbung wurde angenommen"`
  - `body_title`: `"Ihre Bewerbung wurde angenommen"`
  - `body_lines`: Glueckwunsch-Text + Aufforderung Termin zu buchen
  - `button_text`: `"Termin buchen"`
  - `button_url`: `https://{prefix}.{domain}/bewerbungsgespraech/{application_id}`
  - `footer_lines`: Karriere-Link (wie im Admin-Panel)

**Bei `auto_accept === false`:** Alles bleibt wie bisher ("Bewerbung eingegangen", kein Button).

### Technische Details

- Domain-Query: `brandings` Tabelle nach `domain` und `subdomain_prefix` (Fallback `"web"`)
- Karriere-Link ohne Subdomain-Prefix: `https://{domain}/karriere`
- Buchungs-Link mit Prefix: `https://{prefix}.{domain}/bewerbungsgespraech/{id}`
- Telegram-Nachricht bleibt unveraendert

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/submit-application/index.ts` | E-Mail-Block: bei `auto_accept` → `bewerbung_angenommen` mit Button statt `bewerbung_eingegangen` |

