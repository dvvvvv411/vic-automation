

# Bewertungen-Seite: Cards mit Durchschnitt + Detail-Popup

## Problem

Aktuell werden alle einzelnen Bewertungsfragen direkt auf der Seite angezeigt. Das ist unuebersichtlich. Stattdessen soll pro Auftrag nur eine kompakte Card mit der Durchschnittsbewertung gezeigt werden, und die einzelnen Fragen erst in einem Detail-Dialog sichtbar sein.

## Loesung

### Neue Darstellung pro Auftrag-Card
- **Auftragstitel** und **Auftragsnummer** im Header
- **Durchschnittsbewertung** gross dargestellt (z.B. "4.2" mit Sternen)
- **Anzahl Fragen** als Info (z.B. "3 Bewertungen")
- **Bewertungsdatum**
- **"Details ansehen"-Button** oeffnet einen Dialog

### Detail-Dialog (Popup)
- Oeffnet sich per Klick auf den Button
- Zeigt alle einzelnen Bewertungsfragen mit:
  - Frage-Text
  - Sternebewertung (read-only)
  - Kommentar (falls vorhanden)
- Nutzt die bestehende `Dialog`-Komponente aus `src/components/ui/dialog.tsx`

### Layout
- Responsive Grid (1 Spalte mobil, 2 Spalten ab md) fuer die Auftrag-Cards
- Gleicher Card-Stil wie ueberall (gradient-stripe, border-border/60, shadow-sm, hover-Effekt)

## Technische Umsetzung

### Betroffene Datei
| Datei | Aenderung |
|---|---|
| `src/pages/mitarbeiter/MitarbeiterBewertungen.tsx` | Kompletter Umbau der Darstellung |

### Aenderungen im Detail

1. **State fuer Dialog**: `selectedGroup` State hinzufuegen, der die aktuell geoeffnete Gruppe haelt
2. **Durchschnittsberechnung**: Pro Gruppe den Schnitt aller Ratings berechnen (`reviews.reduce / reviews.length`)
3. **Card-Grid**: Statt der aktuellen Einzel-Darstellung ein Grid mit kompakten Cards:

```text
+----------------------------------+
| [Gradient-Stripe]                |
| Auftragstitel          #AUF-001  |
| Bewertet am 12. Januar 2026      |
|                                  |
|  ★★★★☆  4.2 / 5                 |
|  3 Bewertungen                   |
|                                  |
|  [Details ansehen]               |
+----------------------------------+
```

4. **Dialog**: Beim Klick oeffnet sich ein Dialog mit ScrollArea fuer die einzelnen Fragen -- gleiche Darstellung wie bisher (Frage, Sterne, Kommentar), aber eben im Popup

