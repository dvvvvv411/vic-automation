

## Plan: Oeffentliche Bewerbungsgespraech-Buchungsseite (Domain-basiert, beliebige Subdomain)

### Konzept

Route: `/bewerbungsgespraech/buchen` — ein fester Link. Die `branding_id` wird anhand der Domain ermittelt, wobei beliebige Subdomains (nicht nur `web.`) abgeschnitten werden — identisch zur Auth-Seite-Logik:

```typescript
let hostname = window.location.hostname;
const parts = hostname.split(".");
if (parts.length > 2) {
  hostname = parts.slice(-2).join(".");
}
// → Supabase-Query: brandings.domain = hostname
```

### Ablauf

```text
Link: https://dashboard.kundenname.de/bewerbungsgespraech/buchen
  → Domain-Erkennung (dashboard.kundenname.de → kundenname.de)
  → Branding laden (Logo, Farbe, Recruiter-Card)
  → User gibt ein: Vorname, Nachname, E-Mail, Telefon
  → Edge Function erstellt Application (Status: akzeptiert)
  → Redirect auf /bewerbungsgespraech/{applicationId}
  → Normaler Buchungsflow
```

### Aenderungen

**1. Edge Function `submit-application` erweitern**
- Neuer optionaler Parameter `auto_accept` (boolean)
- Wenn `true`: Status = `akzeptiert`, `employment_type` nicht required

**2. Neue Seite `src/pages/BewerbungsgespraechPublic.tsx`**
- Route: `/bewerbungsgespraech/buchen`
- Domain-Erkennung: gleiche Logik wie `Auth.tsx` — `hostname.split(".").slice(-2).join(".")` bei mehr als 2 Teilen, dann Query auf `brandings.domain`
- Fallback auf `frik-maxeiner.de` Branding (wie Auth-Seite)
- Branding-Farbe, Logo, Favicon, Recruiter-Card laden
- Formular: Vorname, Nachname, E-Mail, Telefon
- Submit ruft `submit-application` Edge Function mit `auto_accept=true` und `branding_id`
- Nach Erfolg: Redirect auf `/bewerbungsgespraech/{applicationId}`
- Glassmorphism-Stil passend zu den bestehenden Buchungsseiten

**3. Route in `App.tsx`**
- `<Route path="/bewerbungsgespraech/buchen" element={<BewerbungsgespraechPublic />} />`
- Muss VOR der bestehenden `/bewerbungsgespraech/:id` Route stehen

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/submit-application/index.ts` | `auto_accept` Parameter, `employment_type` optional |
| `src/pages/BewerbungsgespraechPublic.tsx` (neu) | Formular mit Domain-basiertem Branding |
| `src/App.tsx` | Neue Route |

