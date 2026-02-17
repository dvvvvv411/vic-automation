

# Auszahlungsdatum von 1. auf 15. des Monats aendern

## Problem
Aktuell wird ueberall der 1. des naechsten Monats als Auszahlungsdatum angezeigt. Es soll auf den 15. geaendert werden.

## Betroffene Stellen

Es gibt **zwei Dateien**, in denen das Auszahlungsdatum berechnet wird:

### 1. `src/components/mitarbeiter/DashboardPayoutSummary.tsx` (Zeile 15)
- Aktuell: `startOfMonth(addMonths(new Date(), 1))` (= 1. des Folgemonats)
- Neu: Den 15. des aktuellen oder naechsten Monats berechnen. Wenn heute vor dem 15. liegt, wird der 15. dieses Monats genommen. Wenn heute der 15. oder spaeter ist, wird der 15. des naechsten Monats genommen.

### 2. `src/pages/mitarbeiter/MeineDaten.tsx` (Zeile 227)
- Gleiche Logik wie oben: `startOfMonth(addMonths(new Date(), 1))` durch die neue Berechnung mit dem 15. ersetzen.

## Logik

```text
Heute = 17. Februar 2026
  -> 17 >= 15 -> naechste Auszahlung = 15. Maerz 2026

Beispiel: 10. Maerz 2026
  -> 10 < 15 -> naechste Auszahlung = 15. Maerz 2026
```

| Datei | Aenderung |
|-------|-----------|
| `src/components/mitarbeiter/DashboardPayoutSummary.tsx` | Auszahlungsdatum auf den 15. umstellen |
| `src/pages/mitarbeiter/MeineDaten.tsx` | Gleiche Anpassung fuer die Gehaltsseite |

