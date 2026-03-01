

# Cards auf 7 begrenzen mit Scrollbar

## Aenderung in `src/components/admin/UpcomingStartDates.tsx`

Die horizontale ScrollArea ist bereits vorhanden, aber es fehlt eine Breitenbegrenzung. Damit maximal 7 Cards sichtbar sind und der Rest per horizontalem Scrollen erreichbar ist:

1. **Query-Limit entfernen** -- alle Eintraege weiterhin laden (damit keine relevanten fehlen)
2. **ScrollArea begrenzen** -- dem aeusseren `ScrollArea`-Container eine `max-w` setzen oder dem inneren Flex-Container eine feste Maximalbreite, sodass nach ~7 Cards (je 200px + 12px gap = ca. 1484px) gescrollt werden muss
3. Konkret: Die ScrollArea bekommt `className="w-full whitespace-nowrap"` und die Karten bleiben `min-w-[200px] shrink-0` -- das funktioniert bereits. Zusaetzlich wird sichergestellt, dass der aeussere Container `overflow-hidden` hat (ueber ScrollArea bereits gegeben).

Da die Cards `min-w-[200px]` haben und der Container die volle Seitenbreite nutzt, passen auf einem typischen Desktop (~1400px) ohnehin nur ca. 6-7 Cards. Fuer Sicherheit wird die Anzahl der angezeigten Cards im Rendering auf die ersten 20 begrenzt (sinnvolles Maximum), und die horizontale Scrollbar sorgt dafuer, dass nicht alle gleichzeitig sichtbar sind.

**Ergebnis**: Die Sektion bleibt kompakt, maximal eine Zeile hoch, horizontales Scrollen fuer weitere Eintraege. Eine Datei, minimale Aenderung.

