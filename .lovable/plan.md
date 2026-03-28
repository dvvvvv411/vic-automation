

## Plan: Copy-Button fuer 1. Arbeitstag Link bei erfolgreichem Probetag

### Uebersicht

Bei `/admin/probetag` wird in der Aktionen-Spalte ein Copy-Button angezeigt, wenn der Status `erfolgreich` ist. Der Button generiert den 1. Arbeitstag Buchungslink via `buildBrandingUrl` und kopiert ihn in die Zwischenablage.

### Aenderung

**`AdminProbetag.tsx`**

- Import `Copy` (oder `Link`) Icon aus `lucide-react`
- In der Aktionen-Spalte (Zeile ~319-329): wenn `item.status === "erfolgreich"`, neuen Button anzeigen
- onClick-Handler:
  1. `application_id` aus `item.application_id` nehmen
  2. `brandingId` aus `item.applications?.brandings?.id`
  3. `buildBrandingUrl(brandingId, /erster-arbeitstag/${application_id})` aufrufen
  4. In Zwischenablage kopieren + Toast "1. Arbeitstag Link kopiert!"

Genau dasselbe Pattern wie in `AdminArbeitsvertraege.tsx` (Zeile 516-520).

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminProbetag.tsx` | Copy-Button bei `status === "erfolgreich"` in Aktionen-Spalte |

