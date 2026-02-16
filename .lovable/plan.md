
# Zahlen in Dashboard und Meine Daten dezenter machen

## Aenderungen

### 1. Dashboard Stat-Cards (MitarbeiterDashboard.tsx, Zeile 304)
- Von `text-4xl font-extrabold` zu `text-2xl font-semibold` -- deutlich dezenter, aber noch gut lesbar

### 2. Meine Daten StatCards (MeineDaten.tsx, Zeile 298)
- Von `text-3xl font-extrabold` zu `text-2xl font-semibold` -- gleicher dezenterer Stil

## Technische Details

Zwei einfache Klassen-Aenderungen:

**MitarbeiterDashboard.tsx** (Zeile 304):
```
// Vorher:
<div className="text-4xl font-extrabold tracking-tight text-foreground">

// Nachher:
<div className="text-2xl font-semibold tracking-tight text-foreground">
```

**MeineDaten.tsx** (Zeile 298):
```
// Vorher:
<p className="text-3xl font-extrabold text-foreground">

// Nachher:
<p className="text-2xl font-semibold text-foreground">
```

Keine weiteren Dateien betroffen. Rein visuelle Aenderung.
