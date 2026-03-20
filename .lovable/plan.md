

## Problem

Die "Anhänge einreichen"-Buttons und "Anhänge erforderlich"-Badges werden sofort angezeigt, auch wenn der Mitarbeiter die Bewertung noch gar nicht abgegeben hat. Die Anhänge sind aber der letzte Schritt — erst nach der Bewertung relevant.

## Ursache

In beiden Dateien (`MitarbeiterDashboard.tsx` und `MitarbeiterAuftraege.tsx`) prüfen die `StatusButton`-Komponente und die Badge-Anzeige nur `attachmentsPending`, aber nicht ob `hasReviewSubmitted === true` ist.

## Umsetzung

### 1. `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`

Drei Stellen anpassen:

- **StatusButton**: Die beiden Attachment-Checks (`attachmentsSubmitted` und `attachmentsPending`) jeweils zusätzlich an `hasReviewSubmitted` koppeln. Wenn keine Bewertung abgegeben → normaler "Auftrag starten/fortführen"-Button.
- **Badge "Anhänge erforderlich"**: Ebenfalls nur anzeigen wenn `hasReviewSubmitted === true`.

### 2. `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`

Gleiche Logik:

- **StatusButton**: `attachmentsSubmitted`- und `attachmentsPending`-Checks nur greifen lassen wenn `hasReviewSubmitted`.
- **Badge "Anhänge erforderlich"**: Nur rendern wenn `hasReviewSubmitted === true`.

### Konkrete Änderungen

In beiden `StatusButton`-Komponenten:

```typescript
// Vorher:
if (attachmentsSubmitted && status !== "erfolgreich") { ... }
if (attachmentsPending && status !== "erfolgreich") { ... }

// Nachher:
if (hasReviewSubmitted && attachmentsSubmitted && status !== "erfolgreich") { ... }
if (hasReviewSubmitted && attachmentsPending && status !== "erfolgreich") { ... }
```

Bei beiden Badge-Renderstellen:

```typescript
// Vorher:
{a.attachmentsPending && a.status !== "erfolgreich" && (

// Nachher:
{a.hasReviewSubmitted && a.attachmentsPending && a.status !== "erfolgreich" && (
```

Keine weiteren Änderungen nötig. Die Daten (`hasReviewSubmitted`) werden bereits korrekt geladen.

