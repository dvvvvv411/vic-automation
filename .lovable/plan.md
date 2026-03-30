

## Plan: Anstellungsart-Fallback über contract_templates

### Problem
`employment_type` ist bei manchen `employment_contracts` leer UND bei der zugehörigen `application` auch. Die Info steckt aber in der `contract_templates`-Tabelle (über `template_id`).

### Lösung in `AdminErsterArbeitstag.tsx`

1. **Select erweitern**: `template_id` zum employment_contracts-Select hinzufügen
2. **Dritte Follow-up-Query**: Nach dem Hauptquery alle `template_id`s sammeln und parallel `contract_templates` per `.in("id", templateIds)` laden (`id, employment_type`)
3. **Fallback-Kette erweitern**: `ec.employment_type → application.employment_type → contractTemplate.employment_type → "–"`

### Betroffene Datei

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminErsterArbeitstag.tsx` | `template_id` im Select, contract_templates Query, Fallback in `resolveItemData` |

