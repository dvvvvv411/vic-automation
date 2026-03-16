

# Vertragsvorlagen-Cards: Nur Titel/Anstellungsart/Gehalt + Vorschau-Button

## Problem
Die Template-Cards auf `/mitarbeiter/arbeitsvertrag` zeigen aktuell den Vertragstext inline an (line-clamp-3). Der User will nur Titel, Anstellungsart und Gehalt sehen, mit einem "Vorschau"-Button der den Vertragstext in einem Dialog oeffnet.

## Aenderungen in `MitarbeiterArbeitsvertrag.tsx`

### 1. State fuer Vorschau-Dialog
- Neuer State `previewTemplate` (null oder Template-Objekt)

### 2. Card anpassen (Zeilen 450-468)
- **Entfernen**: Den `t.content`-Block (Zeilen 465-467) mit `dangerouslySetInnerHTML`
- **Hinzufuegen**: "Vorschau"-Button (mit `FileText`-Icon) der `previewTemplate` setzt, ohne die Card-Selection auszuloesen (`e.stopPropagation()`)

### 3. Vorschau-Dialog
- Neuer `Dialog` mit `DialogContent` der den vollen `t.content` als HTML anzeigt (via `prose`-Klasse)
- Titel des Dialogs = Template-Titel

### Betroffene Datei
| Datei | Aenderung |
|-------|----------|
| `MitarbeiterArbeitsvertrag.tsx` | Inline-Content aus Card entfernen, Vorschau-Button + Dialog hinzufuegen |

