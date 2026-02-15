

# Sterne in Gold statt Branding-Farbe

## Problem
Die Sterne auf der Bewertungsseite und im Detail-Dialog nutzen aktuell `fill-primary text-primary` (Branding-Blau). Sie sollen stattdessen in Gold dargestellt werden.

## Aenderung

### Datei: `src/pages/mitarbeiter/MitarbeiterBewertungen.tsx`

An zwei Stellen muessen die Stern-Farben geaendert werden:

1. **Card-Grid** (Durchschnittsbewertung): `fill-primary text-primary` wird zu `fill-yellow-400 text-yellow-400`
2. **Detail-Dialog** (Einzelbewertungen): `fill-primary text-primary` wird zu `fill-yellow-400 text-yellow-400`

Beide Aenderungen betreffen nur die CSS-Klassen der `Star`-Komponente -- keine Logik-Aenderung.

