

# Zwei Anpassungen: Unterschrift-Text und Arbeitsvertrag-Card Position

## 1. Unterschrift-Dialog: Text aendern

**Datei:** `src/components/mitarbeiter/ContractSigningView.tsx`

- Den Hilfetext unter dem Canvas von "Ort, Datum, Unterschrift" zu nur "Unterschrift" aendern
- Die DialogDescription ebenfalls anpassen: statt "Bitte schreiben Sie Ort, Datum und Ihre Unterschrift" nur "Bitte setzen Sie Ihre Unterschrift in das Feld unten."

## 2. Arbeitsvertrag-Card unter Persoenliche Informationen verschieben

**Datei:** `src/pages/mitarbeiter/MeineDaten.tsx`

- Den "Arbeitsvertrag"-Card-Block (mit FileDown Icon und Download-Button) von seiner aktuellen Position (nach der Bankverbindung) nach oben verschieben, direkt unter die "Persoenliche Informationen"-Card
- Die Reihenfolge wird dann: Persoenliche Informationen > Arbeitsvertrag > Statistiken > Bankverbindung > Verdienst-Historie

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/mitarbeiter/ContractSigningView.tsx` | Zwei Textstellen anpassen (DialogDescription + Canvas-Hilfetext) |
| `src/pages/mitarbeiter/MeineDaten.tsx` | Arbeitsvertrag-Card Block nach oben verschieben |

