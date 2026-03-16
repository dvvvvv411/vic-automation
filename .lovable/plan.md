

# Fix: Festgehalt wird auf "Meine Daten" nicht erkannt

## Problem

In `src/pages/mitarbeiter/MeineDaten.tsx` Zeile 145 steht:

```ts
const isFixedSalary = branding?.payment_model === "festgehalt";
```

Der tatsaechliche DB-Wert ist aber `"fixed_salary"` (so wird er in `AdminBrandingForm.tsx` gespeichert und in `MitarbeiterDashboard.tsx` korrekt abgefragt). Deshalb ist `isFixedSalary` immer `false` auf der Meine-Daten-Seite, was dazu fuehrt:

1. Statistiken-Card zeigt "Kontostand 0€" statt "Festgehalt"
2. Gehaltsauszahlungen zeigt "0€" statt das Festgehalt
3. Verdienst-Historie wird angezeigt statt ausgeblendet

## Loesung

**Datei: `src/pages/mitarbeiter/MeineDaten.tsx`**

Zeile 145 aendern von:
```ts
const isFixedSalary = branding?.payment_model === "festgehalt";
```
zu:
```ts
const isFixedSalary = branding?.payment_model === "fixed_salary";
```

Das ist die einzige Aenderung. Die restliche Logik (Statistiken, Gehaltsauszahlung, Verdienst-Historie ausblenden) ist bereits korrekt implementiert und greift sobald `isFixedSalary` den richtigen Wert hat.

