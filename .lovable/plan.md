

## Plan: Stundenlohn-Card im Dashboard vereinfachen

### Problem
Die Statistik-Card für Stundenlohn-Mitarbeiter zeigt aktuell zwei Zeilen: den Gesamtverdienst als großen Wert und darunter den Stundensatz. Der User möchte stattdessen nur den Stundenlohn sehen — groß z.B. "29,00 €" und darunter "pro Stunde".

### Lösung

**Datei: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`**, Zeile 353-354

Die `isHourlyRate`-Variante in der `stats`-Array ändern von:
```
{ label: "Verdienst (Stundenlohn)", value: `${hourlyEarnings.toFixed(2)} €`, icon: Euro, detail: `${getHourlyRate().toFixed(2)} €/Std.` }
```
zu:
```
{ label: "Stundenlohn", value: `${getHourlyRate().toFixed(2)} €`, icon: Euro, detail: "pro Stunde" }
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | Stats-Card: Stundensatz als Hauptwert, "pro Stunde" als Detail |

