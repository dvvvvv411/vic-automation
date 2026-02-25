
# Download-Button fuer Desktop & Tablet-Layout anpassen

## Aenderungen in `src/components/mitarbeiter/ContractSigningView.tsx`

### 1. Tablet-View gleichsetzen mit Mobile-View

Der Breakpoint `md:hidden` (Zeile 135) wird zu `lg:hidden` geaendert, sodass die Buttons (Unterschreiben + Herunterladen) auf Tablet UND Mobile **ueber** dem PDF angezeigt werden. Der Breakpoint fuer den Desktop-Bereich (Zeile 169 `hidden md:flex`) wird zu `hidden lg:flex`.

### 2. Download-Button fuer Desktop hinzufuegen

Im Desktop-Bereich (unterhalb des PDFs, `hidden lg:flex`) wird neben dem "Vertrag unterschreiben"-Button ein dezenter Download-Button ergaenzt -- gleicher Stil wie auf Mobile (`variant="ghost"`, `size="sm"`, `text-muted-foreground`).

### Ergebnis

| Viewport | Buttons ueber PDF | Buttons unter PDF |
|----------|-------------------|-------------------|
| Mobile   | Unterschreiben + Download | -- |
| Tablet   | Unterschreiben + Download | -- |
| Desktop  | -- | Unterschreiben + Download (dezent) |

Keine neuen Dateien oder Abhaengigkeiten. Eine Datei, drei kleine Aenderungen.
