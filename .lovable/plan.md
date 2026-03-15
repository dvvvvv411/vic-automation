

# Beschreibung mit Zeilenumbrüchen anzeigen

## Problem
Die Beschreibung wird als einfacher `<p>`-Tag gerendert (Zeile 394), wodurch Zeilenumbrüche verloren gehen.

## Lösung
`whitespace-pre-line` CSS-Klasse hinzufügen, damit `\n`-Zeichen als Zeilenumbrüche dargestellt werden.

### Änderung in `AuftragDetails.tsx`
**Zeile 394**: `<p className="text-sm text-muted-foreground mt-1">` → `<p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">`

Dasselbe für die Work-Step-Beschreibungen (Zeile 470) anwenden.

