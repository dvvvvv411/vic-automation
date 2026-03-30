

## Plan: Copy-Button auf 1. Arbeitstag Link umstellen

In `src/pages/admin/AdminArbeitsvertraege.tsx` den bestehenden Copy-Button in der Listendarstellung (Zeilen 348-366) aendern:

1. **URL aendern**: Statt `/arbeitsvertrag/${appId}` → `/erster-arbeitstag/${item.id}` (identisch zur Popup-Logik)
2. **Tooltip aendern**: "Link kopieren" → "1. Arbeitstag Link kopieren"
3. **Icon aendern**: `Copy` → `CalendarIcon` (wie im Popup)
4. **Nur bei genehmigten Vertraegen anzeigen**: Button nur rendern wenn `item.status === "genehmigt"`

### Betroffene Datei
| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminArbeitsvertraege.tsx` | Copy-Button URL, Tooltip, Icon und Sichtbarkeit anpassen (Zeilen 348-366) |

