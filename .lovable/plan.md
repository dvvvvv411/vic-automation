

# Anstehende Startdaten: Grid mit Scrollbar

## Aenderung in `src/components/admin/UpcomingStartDates.tsx`

Das aktuelle Layout ist eine horizontale Scroll-Leiste (`flex` + `ScrollBar horizontal`). Stattdessen wird ein Grid mit max 7 Spalten und vertikaler Scrollbar verwendet.

### Aenderungen:

1. **Flex-Layout ersetzen durch Grid**: `flex gap-3` wird zu `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3`. So passen auf grossen Bildschirmen 7 Cards in eine Reihe.

2. **ScrollArea mit fester Hoehe**: Die `ScrollArea` bekommt eine `max-h` (ca. 220px, Platz fuer ~2 Reihen Cards). Gibt es mehr als 2 Reihen, erscheint eine vertikale Scrollbar nur in dieser Sektion.

3. **Horizontale ScrollBar entfernen**: Die `<ScrollBar orientation="horizontal" />` wird entfernt, da nicht mehr noetig.

4. **`min-w-[200px] shrink-0`** von den Cards entfernen, da das Grid die Breite steuert.

### Ergebnis

- Bis 7 Cards: eine Reihe, kein Scrollbar
- 8-14 Cards: zwei Reihen, kein Scrollbar
- Ab 15 Cards: vertikaler Scroll innerhalb der Sektion, Seite bleibt kompakt

Eine Datei, wenige Zeilen.
