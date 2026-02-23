

# Draft-Preview: Mehrzeilige Begrenzung im Admin Livechat

## Problem

Die Entwurfs-Vorschau ("... schreibt: ...") im Admin Livechat zeigt den gesamten Text in einer Zeile mit `truncate`. Bei langen Nachrichten wird die Seite horizontal verbreitert, statt den Text umzubrechen oder abzuschneiden.

## Loesung

In `src/pages/admin/AdminLivechat.tsx` (Zeile 528) wird die CSS-Klasse von `truncate` (einzeilig) auf eine mehrzeilige Begrenzung umgestellt:

- `truncate` entfernen
- Stattdessen `line-clamp-2` verwenden (begrenzt auf maximal 2 Zeilen, bricht um und schneidet mit "..." ab)
- `break-words` und `overflow-hidden` hinzufuegen, damit lange Woerter korrekt umgebrochen werden

### Vorher
```
<p className="text-sm text-muted-foreground italic truncate">
```

### Nachher
```
<p className="text-sm text-muted-foreground italic line-clamp-2 break-words overflow-hidden">
```

Eine einzige Zeilen-Aenderung, keine weiteren Dateien betroffen.
