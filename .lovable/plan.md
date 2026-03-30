

## Plan: 1. Arbeitstag Link-Button aus Probetag entfernen

In `src/pages/admin/AdminProbetag.tsx` den gesamten Block entfernen, der bei `status === "erfolgreich"` den Copy-Button für den 1. Arbeitstag Link rendert (ca. Zeilen 219-236 im aktuellen File — der Button mit `<Copy>` Icon und `buildBrandingUrl`/`employment_contracts`-Query).

### Betroffene Datei
| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminProbetag.tsx` | Copy-Link-Button Block entfernen |

