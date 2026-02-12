

# Komplettes Redesign: /bewerbungsgespraech -- Professionelles Fintech-Design

## Problem

Die Seite wirkt zusammengewuerfelt: Separate schwebende Cards ohne visuelle Verbindung, inkonsistente Abstands- und Schattensysteme, generischer Kalender der nicht zum Branding passt, und eine "Baukasten"-Aesthetik ohne Designsystem.

## Loesung: Einheitliches, reduziertes Fintech-Design

Eine einzelne, zusammenhaengende Seite statt separater, schwebender Karten. Alles fliesst in einem durchgaengigen Layout zusammen.

### Designprinzipien
- **Ein Container, nicht drei**: Header, Bewerber-Info und Buchungstool werden in EINE zusammenhaengende Card integriert statt drei separate schwebende Elemente
- **Subtiler Hintergrund**: Kein bunter Gradient, sondern ein sauberer, heller Hintergrund (leichtes Grau)
- **Branding als Akzent, nicht als Hauptfarbe**: Die Brandingfarbe wird nur fuer ausgewaehlte Elemente genutzt (Buttons, ausgewaehlter Tag, Akzentlinien), nicht grossflaechig
- **Typografie-Hierarchie**: Klare Abstufung -- grosser Titel, mittlere Untertitel, kleine Labels
- **Kalender-Integration**: Der Kalender bekommt Custom-Styling das zur Seite passt (selected day in Brandingfarbe)

### Aufbau (von oben nach unten, EINE Card)

```text
+--------------------------------------------------+
|  [Logo]                                          |
|                                                  |
|  Bewerbungsgespraech                             |
|  Hallo Max Mustermann                            |
|  +49 123 456789                                  |
|                                                  |
|  Waehlen Sie Ihren Wunschtermin                  |
|                                                  |
|  +-----------------------+---------------------+ |
|  |                       |                     | |
|  |     Kalender          |   Zeitslots         | |
|  |                       |                     | |
|  +-----------------------+---------------------+ |
|                                                  |
|  [ Termin buchen: 12.02.2026 um 14:00 Uhr ]     |
|                                                  |
+--------------------------------------------------+
```

### Konkrete Aenderungen

**1. Aeusserer Container:**
- Hintergrund: `bg-slate-50` statt dynamischem Gradient
- Zentrierter Inhalt mit `max-w-2xl` (schmaler, fokussierter)

**2. Einzelne Card statt drei:**
- Eine grosse Card mit `shadow-sm border border-slate-200` (subtil, nicht `shadow-xl border-0`)
- Innen: Logo, Titel, Bewerber-Info, Trennlinie, Kalender+Slots, Button -- alles fliessend

**3. Bewerber-Info inline:**
- Kein separates Card-Element -- Name und Telefon werden als Teil des Headers dargestellt
- Subtiler Text, kein eigener Container mit Schatten

**4. Kalender:**
- Custom classNames: selected day bekommt Brandingfarbe statt Standard-Blau
- Saubere Integration ohne eigene Ueberschriften mit Icons (die wirken "baukasten-maessig")

**5. Zeitslots:**
- Einheitliche, flache Buttons mit `border-slate-200` statt `border-border`
- Hover: Dezenter Brandingfarben-Hintergrund
- Selected: Brandingfarbe mit weissem Text, KEIN shadow-md

**6. Buchen-Button:**
- Volle Breite innerhalb der Card, nicht zentriert schwebend ausserhalb
- Clean, ohne extra Motion-Animation

**7. Bestaetigungsseite:**
- Gleiches Designsystem: eine saubere Card, Logo oben, Hakenzeichen dezent
- Kein `shadow-xl`, kein Gradient-Hintergrund
- Hinweis-Box: Dezentes Grau statt Amber/Gelb

**8. Bestaetigungsdialog:**
- Gleicher dezenter Stil, keine bunten Hintergruende in der Terminzusammenfassung

## Technische Details

### Geaenderte Datei

| Datei | Aenderung |
|---|---|
| `src/pages/Bewerbungsgespraech.tsx` | Komplettes Layout-Refactoring: Zusammenfuehrung in eine Card, Entfernung von ueberfluessigen Wrappern/Schatten/Gradienten, Kalender-Styling mit Brandingfarbe, konsistente Typografie |

### Keine neuen Dateien oder Abhaengigkeiten

