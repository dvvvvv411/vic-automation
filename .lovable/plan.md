

# Sortierung ueber alle Seiten hinweg korrigieren

## Problem

Die Supabase-Abfrage holt nur 20 Eintraege pro Seite (`.range(page * 20, ...)`), und die Sortierung nach Vertragsstatus (unterzeichnet > genehmigt > eingereicht > offen) passiert erst danach im Client. Das bedeutet: Seite 1 wird fuer sich sortiert, Seite 2 wird fuer sich sortiert -- aber ein "unterzeichnet"-Eintrag auf Seite 2 haette eigentlich auf Seite 1 sein muessen.

## Loesung

Alle Eintraege auf einmal laden und die Paginierung rein clientseitig machen. So kann die Sortierung ueber alle Daten hinweg korrekt arbeiten.

**Datei: `src/pages/admin/AdminArbeitsvertraege.tsx`**

### Aenderungen:

1. **Query anpassen (Zeile 32-63)**: Den `page`-Parameter aus dem `queryKey` entfernen und `.range()` aus der Supabase-Abfrage entfernen. Stattdessen alle Eintraege auf einmal laden (`.select(...)` ohne `.range()`). Die `count`-Option kann ebenfalls entfallen.

2. **Clientseitige Paginierung (Zeile 65-98)**: Nach dem Sortieren in `sortedItems` wird ein `.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)` angewendet, um nur die aktuelle Seite anzuzeigen.

3. **totalPages berechnen (Zeile 100)**: Basierend auf `sortedItems.length` statt `data?.total`.

4. **Rendering (Zeile 209)**: `sortedItems` durch die geschnittene Liste ersetzen (z.B. `paginatedItems`).

```text
Vorher:  Server holt Seite X -> Client sortiert nur diese 20 Eintraege
Nachher: Server holt alles   -> Client sortiert alles -> Client zeigt Seite X an
```

Keine neuen Dateien oder Abhaengigkeiten. Eine Datei wird geaendert.
