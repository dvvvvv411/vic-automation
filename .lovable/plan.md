

# Fix: CORS-Problem bei anosim.net API

## Problem

Der direkte `fetch`-Aufruf von `https://anosim.net/api/v1/orderbookingshare?token=...` aus dem Browser schlaegt fehl wegen **CORS** (Cross-Origin Resource Sharing). Der anosim.net-Server erlaubt keine Anfragen von fremden Domains im Browser.

## Loesung

Eine **Supabase Edge Function** als Proxy erstellen, die den API-Aufruf serverseitig macht und das Ergebnis an den Browser weitergibt.

### 1. Neue Edge Function: `supabase/functions/anosim-proxy/index.ts`

- Nimmt die anosim-URL als Query-Parameter entgegen
- Validiert, dass die URL `anosim.net/api/v1/orderbookingshare` enthaelt
- Ruft die URL serverseitig per `fetch` auf (kein CORS-Problem)
- Gibt die JSON-Antwort mit CORS-Headern zurueck

### 2. Aenderung in `src/pages/admin/AdminTelefonnummern.tsx`

- Statt direkt `fetch(entry.api_url)` aufzurufen, wird die Anfrage ueber die Edge Function geleitet:
  `supabase.functions.invoke("anosim-proxy", { body: { url: entry.api_url } })`
- Alternativ: `fetch(\`\${supabaseUrl}/functions/v1/anosim-proxy?url=\${encodeURIComponent(entry.api_url)}\`)`

### Zusammenfassung

| Datei | Aenderung |
|---|---|
| `supabase/functions/anosim-proxy/index.ts` | Neue Edge Function (Proxy) |
| `AdminTelefonnummern.tsx` | Fetch ueber Proxy statt direkt |

