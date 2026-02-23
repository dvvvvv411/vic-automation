
# Auftragstermine: 18:00-Uhr-Slot hinzufuegen

## Problem

Die Zeitslots fuer Auftragstermine enden aktuell um 17:30. Der Slot um 18:00 fehlt.

## Loesung

In zwei Dateien wird die Slot-Generierung von `length: 20` auf `length: 21` geaendert. Das fuegt den Slot "18:00" hinzu.

### Aenderungen

**1. `src/pages/mitarbeiter/AuftragDetails.tsx` (Zeile 46)**
```
// Vorher
const TIME_SLOTS = Array.from({ length: 20 }, ...);
// Nachher
const TIME_SLOTS = Array.from({ length: 21 }, ...);
```

**2. `src/components/admin/OrderAppointmentBlocker.tsx` (Zeile 15)**
```
// Vorher
const ORDER_TIME_SLOTS = Array.from({ length: 20 }, ...);
// Nachher
const ORDER_TIME_SLOTS = Array.from({ length: 21 }, ...);
```

Beide Stellen nutzen dieselbe Formel (`Math.floor(i/2) + 8`), sodass `i=20` korrekt `18:00` ergibt. Keine weiteren Aenderungen noetig.
