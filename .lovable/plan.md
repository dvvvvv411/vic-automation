

## Subdomain-Prefix fuer Brandings

### Uebersicht

Neues Feld `subdomain_prefix` auf `brandings` (Default `web`). Wird im Branding-Formular editierbar und in `buildBrandingUrl.ts` statt des hardcodierten `web.` verwendet.

### 1. Datenbank-Migration

```sql
ALTER TABLE public.brandings
  ADD COLUMN subdomain_prefix text NOT NULL DEFAULT 'web';
```

Damit bekommen alle bestehenden Brandings automatisch `web` als Prefix.

### 2. AdminBrandingForm.tsx

Neues Eingabefeld "Subdomain-Prefix" in der Stammdaten-Card, unter dem Domain-Feld:
- Label: "Subdomain-Prefix"
- Placeholder: `web`
- Hinweistext: "Wird als Subdomain vor der Domain verwendet, z.B. web.example.com"
- Formular-Schema erweitern um `subdomain_prefix: z.string().max(50).optional()`

### 3. buildBrandingUrl.ts

Query erweitern um `subdomain_prefix`. Statt `https://web.${domain}` wird `https://${prefix}.${domain}` verwendet:

```typescript
.select("domain, subdomain_prefix")
...
const prefix = data.subdomain_prefix || "web";
return `https://${prefix}.${domain}${path}`;
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration | `subdomain_prefix` Spalte auf `brandings` |
| `AdminBrandingForm.tsx` | Neues Eingabefeld |
| `buildBrandingUrl.ts` | Prefix aus DB statt hardcoded `web` |

