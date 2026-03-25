

## Plan: Vergangene Termine werden nicht angezeigt (Pagination-Bug)

### Problem

Die Query fuer "Vergangene Termine" holt per Server-Pagination 20 Eintraege (sortiert nach Datum DESC). Alle 20 sind von heute. Danach filtert der Client diese Eintraege nach `cutoffTime` — wenn keiner davon alt genug ist, erscheint "Keine Termine", obwohl es auf Seite 2+ aeltere Termine gibt (24.03, 23.03, 21.03).

**Ursache**: Client-seitiges Zeitfiltern NACH Server-seitiger Pagination.

### Loesung

Die Zeitfilterung fuer heute muss auf den Server verlagert werden, damit die Pagination korrekt funktioniert.

### Aenderung in `AdminBewerbungsgespraeche.tsx`

**Past-View Query** (Zeile 72-77): Statt `.lte("appointment_date", today)` mit nachtraeglichem Client-Filter, einen `.or()` Filter verwenden:

```typescript
if (viewMode === "past") {
  query = query
    .or(`appointment_date.lt.${today},and(appointment_date.eq.${today},appointment_time.lt.${cutoffTime})`)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });
}
```

**Default-View Query** (Zeile 84-91): Analog den Client-Filter ersetzen:

```typescript
} else {
  query = query
    .or(`and(appointment_date.eq.${today},appointment_time.gte.${cutoffTime}),appointment_date.eq.${tomorrow}`)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });
}
```

**Client-Filter entfernen** (Zeile 98-114): Den gesamten `if (viewMode === "default") ... else if (viewMode === "past")` Block entfernen, da die Filterung jetzt serverseitig passiert.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminBewerbungsgespraeche.tsx` | `.or()` Filter serverseitig statt Client-Filter nach Pagination |

