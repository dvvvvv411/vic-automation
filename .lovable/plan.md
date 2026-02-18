
# Links auf Branding-Domain umstellen + SMS-Variablen pruefen

## Befund: SMS-Variablen

Alle 6 SMS-Vorlagen ersetzen ihre Platzhalter korrekt:
- bewerbung_angenommen: `{name}`, `{link}` -- ersetzt in AdminBewerbungen.tsx
- vertrag_genehmigt: `{name}`, `{link}` -- ersetzt in create-employee-account
- auftrag_zugewiesen: `{name}`, `{auftrag}` -- ersetzt in AssignmentDialog.tsx
- termin_gebucht: `{name}`, `{datum}`, `{uhrzeit}` -- ersetzt in AuftragDetails.tsx
- bewertung_genehmigt: `{name}`, `{auftrag}`, `{praemie}` -- ersetzt in AdminBewertungen.tsx
- bewertung_abgelehnt: `{name}`, `{auftrag}` -- ersetzt in AdminBewertungen.tsx

Hier besteht kein Handlungsbedarf.

---

## Aenderung: Links auf `web.{domain}` umstellen

Aktuell werden Links mit `window.location.origin` (Lovable-Preview-URL) oder einer Supabase-URL-Ableitung erzeugt. Stattdessen soll die Domain aus dem Branding (`brandings.domain`) verwendet werden, mit `web.` als Subdomain-Prefix.

**Beispiel:** Statt `https://id-preview--abc.lovable.app/bewerbungsgespraech/123` wird `https://web.47-skys.de/bewerbungsgespraech/123` verwendet.

### Neue Hilfsfunktion: `src/lib/buildBrandingUrl.ts`

```
async function buildBrandingUrl(brandingId: string | null, path: string): Promise<string>
```

- Laedt `domain` aus der `brandings`-Tabelle fuer die gegebene `branding_id`
- Gibt `https://web.{domain}{path}` zurueck
- Fallback auf `window.location.origin + path` wenn kein Branding oder keine Domain vorhanden

### Betroffene Dateien (Client-seitig)

| Datei | Aktuelle Link-Erzeugung | Aenderung |
|-------|------------------------|-----------|
| `AdminBewerbungen.tsx` (L129) | `window.location.origin + /bewerbungsgespraech/{id}` | `await buildBrandingUrl(app.branding_id, /bewerbungsgespraech/{id})` |
| `AssignmentDialog.tsx` (L140) | `window.location.origin + /mitarbeiter/auftraege` | `await buildBrandingUrl(brandingId, /mitarbeiter/auftraege)` |

### Betroffene Dateien (Edge Function)

| Datei | Aktuelle Link-Erzeugung | Aenderung |
|-------|------------------------|-----------|
| `create-employee-account/index.ts` (L158 + L208) | `supabaseUrl.replace(...)` | Branding-Domain aus DB laden, `https://web.{domain}/auth` verwenden. Fallback auf bisherige Logik. |

### Zusammenfassung der Dateiaenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/lib/buildBrandingUrl.ts` | Neue Hilfsfunktion |
| `src/pages/admin/AdminBewerbungen.tsx` | Link ueber `buildBrandingUrl` statt `window.location.origin` |
| `src/components/admin/AssignmentDialog.tsx` | Link ueber `buildBrandingUrl` statt `window.location.origin` |
| `supabase/functions/create-employee-account/index.ts` | Domain aus Branding laden, `https://web.{domain}/auth` verwenden |
