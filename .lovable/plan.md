

# Termine auch samstags ermoeglichen

## Problem

Aktuell werden Samstag und Sonntag durch `isWeekend(date)` blockiert. Es sollen aber Termine von Montag bis Samstag moeglich sein -- nur Sonntag bleibt gesperrt.

## Aenderung

| Datei | Aenderung |
|-------|-----------|
| `src/pages/Bewerbungsgespraech.tsx` | In der `disabled`-Funktion des Kalenders (Zeile 284-286): `isWeekend(date)` ersetzen durch `isSunday(date)`. Dazu `isSunday` aus `date-fns` importieren und `isWeekend` aus dem Import entfernen. |

## Technisches Detail

Vorher:
```text
disabled={(date) =>
  isWeekend(date) || isBefore(date, startOfDay(new Date()))
}
```

Nachher:
```text
disabled={(date) =>
  isSunday(date) || isBefore(date, startOfDay(new Date()))
}
```

Import-Zeile aendern von:
```text
import { format, isWeekend, isBefore, startOfDay, isToday } from "date-fns";
```
zu:
```text
import { format, isSunday, isBefore, startOfDay, isToday } from "date-fns";
```

Keine weiteren Dateien betroffen.
