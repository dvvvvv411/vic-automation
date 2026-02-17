

# PDF nahtlos in die Seite einbetten

## Problem
Die PDF wird zwar ohne Toolbar angezeigt, aber der Browser-eigene PDF-Viewer zeigt links und rechts graue Balken, wodurch die PDF optisch abgetrennt wirkt.

## Loesung

**Datei:** `src/components/mitarbeiter/ContractSigningView.tsx`

1. Den weissen Container mit Border und Border-Radius entfernen - stattdessen die iframe direkt ohne umschliessenden Container rendern
2. Der iframe bekommt einen neutralen/weissen Hintergrund und fuellt die volle Breite ohne Rahmen
3. Die grauen Balken kommen vom PDF-Viewer-Hintergrund im iframe - dagegen hilft es, den Container randlos zu machen und `border: none` auf den iframe zu setzen

Konkret:
- Das umschliessende `div` mit `bg-white rounded-xl border border-border shadow-sm overflow-hidden` vereinfachen bzw. entfernen
- Dem iframe `style={{ border: "none" }}` und `className="w-full h-full bg-white"` geben
- Den aeusseren Container (`max-w-4xl`) breiter machen oder entfernen, damit die PDF die volle Breite nutzt und keine seitlichen Abstaende entstehen

| Datei | Aenderung |
|-------|-----------|
| `src/components/mitarbeiter/ContractSigningView.tsx` | Container-Styling anpassen, iframe randlos machen, volle Breite nutzen |

