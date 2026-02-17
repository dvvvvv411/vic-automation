

# PDF auf DIN A4 Groesse begrenzen

## Problem
Die PDF nimmt aktuell die volle Breite ein und wirkt dadurch zu gross. Sie soll maximal die Proportionen eines DIN A4-Blattes haben.

## Loesung

**Datei:** `src/components/mitarbeiter/ContractSigningView.tsx`

- Den PDF-Container auf eine maximale Breite begrenzen, die einem DIN A4-Verhaeltnis entspricht (210mm x 297mm, Verhaeltnis ca. 1:1.414)
- Konkret: `max-w-3xl` (ca. 768px) mit zentrierter Ausrichtung (`mx-auto`)
- Hoehe proportional anpassen auf ca. `65vh`
- Optional einen leichten Schatten hinzufuegen, damit die PDF wie ein Blatt Papier auf der Seite wirkt

| Datei | Aenderung |
|-------|-----------|
| `src/components/mitarbeiter/ContractSigningView.tsx` | PDF-Container mit `max-w-3xl mx-auto` begrenzen, Hoehe reduzieren |

