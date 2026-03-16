

# Fix: Absätze in Vertragsvorschau korrekt anzeigen

## Problem
TipTap erzeugt leere `<p></p>` Tags für Leerzeilen. Browser kollabieren diese zu 0px Höhe, sodass der Vertragstext als ein durchgehender Textblock erscheint.

## Lösung
CSS-Regel hinzufügen, die leeren `<p>` Tags innerhalb von `.prose` eine Mindesthöhe gibt:

### `src/index.css`
```css
.prose p:empty {
  min-height: 1em;
}
.prose p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
```

Das betrifft automatisch alle 4 Stellen:
- `AdminVertragsvorlagen.tsx` (Vorschau-Dialog)
- `AdminVertragsvorlageForm.tsx` (Editor)
- `MitarbeiterArbeitsvertrag.tsx` (Vorlagenauswahl + Vertragsvorschau)
- `MeineDaten.tsx` (Vertrag anzeigen)

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `src/index.css` | CSS für `.prose p:empty` und Absatzabstände |

