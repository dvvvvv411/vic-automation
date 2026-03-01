

# "Anstehende Startdaten" Sektion im Admin Dashboard

## Aenderung

**Datei: `src/pages/admin/AdminDashboard.tsx`**

Die bereits existierende Komponente `UpcomingStartDates` (aus `src/components/admin/UpcomingStartDates.tsx`) wird direkt im Dashboard wiederverwendet -- genau dieselbe Komponente wie auf `/admin/mitarbeiter`.

### Einfuegung

Die Komponente wird zwischen den Stat-Cards und den Detail-Listen eingefuegt (nach Zeile 149, vor Zeile 152). Das ergibt folgende Reihenfolge:

1. Willkommens-Header
2. Stat-Cards (5 Kacheln)
3. **Anstehende Startdaten** (Grid mit ScrollArea -- NEU)
4. Detail-Listen (Bewerbungen, Gespraeche, Vertraege, Termine)

### Umsetzung

- Import von `UpcomingStartDates` aus `@/components/admin/UpcomingStartDates`
- Einfuegen von `<UpcomingStartDates />` zwischen Stat-Cards und Detail-Listen
- Keine neue Logik, keine Duplizierung -- die Komponente bringt alles mit (Query, Grid, ScrollArea, Badges, Animation)

Eine Datei, zwei Zeilen Aenderung (Import + JSX).

