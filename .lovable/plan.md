

# Fix: Unterzeichner-Daten sind nicht branding-isoliert im UI

## Problem
Die Daten (Name/Titel des Unterzeichners) werden zwar korrekt pro Branding in der DB gespeichert (`brandings`-Tabelle, gefiltert nach `activeBrandingId`), aber die Input-Felder verwenden `defaultValue` (uncontrolled inputs). React aktualisiert `defaultValue` **nicht** bei Re-Renders -- deshalb bleibt beim Branding-Wechsel der alte Wert im Feld stehen und wird beim `onBlur` auch noch ins falsche Branding geschrieben.

## Lösung
Ein `key={activeBrandingId}` auf den Container der Firmenunterschrift-Sektion setzen. Das erzwingt ein vollständiges Remount der Inputs beim Branding-Wechsel, sodass `defaultValue` korrekt neu gesetzt wird.

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `src/pages/admin/AdminVertragsvorlagen.tsx` | `key={activeBrandingId}` auf die Firmenunterschrift-Card setzen |

Einzeilige Änderung, Zeile ~325: `<Card>` wird zu `<Card key={activeBrandingId}>`.

