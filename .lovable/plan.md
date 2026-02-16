

# Mitarbeiter-Panel: Attendflow-Style (Helles Theme)

## Was sich bisher NICHT geaendert hat (und jetzt aendert)

Die bisherigen Aenderungen waren kaum sichtbar, weil nur Opacity-Werte und Border-Staerken minimal angepasst wurden. Diesmal werden die Aenderungen deutlich sichtbar sein.

## Attendflow-Designmerkmale (uebertragen auf helles Theme)

Attendflow nutzt: gefuellte Nav-Pills (aktiver Menuepunkt hat einen soliden farbigen Hintergrund mit weissem Text), grosse fette Zahlen in Stat-Cards, Uppercase-Labels, klare visuelle Hierarchie, abgerundete Cards mit deutlichen Schatten, farbige Akzent-Elemente.

## Konkrete sichtbare Aenderungen

### 1. Sidebar - Aktiver Nav-Item wird gefuellte Pill (MitarbeiterSidebar.tsx)

Bisher: `bg-primary/[0.08] text-primary` (kaum sichtbar, nur leichter Farbton)
Neu: `bg-primary text-white shadow-md` (solide gefuellte Pill wie bei Attendflow)

Zusaetzlich:
- Nav-Items bekommen mehr Padding und groessere Rundung (`rounded-xl`)
- Hover-State wird staerker: `hover:bg-slate-100`
- Icons werden etwas groesser (20px statt 18px)
- Logo-Bereich bekommt mehr vertikalen Raum
- User-Avatar im Footer bekommt einen `ring-2 ring-primary/20`

### 2. Layout und Header (MitarbeiterLayout.tsx)

- Content-Hintergrund wird `bg-slate-50` (sichtbar heller als Cards)
- Header bekommt eine subtile `shadow-sm` statt nur border-bottom
- Header-Hoehe auf `h-16` erhoehen

### 3. Dashboard Stat-Cards (MitarbeiterDashboard.tsx)

Bisher: Standardmaessige Cards mit kleinen Icons
Neu (Attendflow-Style):
- Labels werden `uppercase text-[11px] tracking-wider font-medium` (wie "PRESENT", "ABSENT" bei Attendflow)
- Zahlen werden groesser: `text-4xl font-extrabold` statt `text-3xl font-bold`
- Icon-Container: `bg-primary text-white rounded-xl shadow-md shadow-primary/20` (gefuelltes Icon wie Attendflow)
- Cards bekommen `rounded-2xl shadow-md` statt `rounded-xl shadow-sm`
- Hover: `hover:shadow-lg hover:-translate-y-0.5 transition-all`

### 4. Auftrags-Cards (MitarbeiterDashboard.tsx + MitarbeiterAuftraege.tsx)

- Cards bekommen `rounded-2xl shadow-md` statt `rounded-xl shadow-sm`
- Farbiger linker Rand: `border-l-4 border-primary` fuer offene Auftraege
- "Auftrag starten" Button: `bg-primary text-white rounded-xl shadow-md` (prominent, nicht gradient)
- Order-Nummer Badge: `bg-primary/10 text-primary font-bold`

### 5. Bewertungen (MitarbeiterBewertungen.tsx)

- Cards: `rounded-2xl shadow-md`
- Staerkere visuelle Abgrenzung

### 6. Meine Daten (MeineDaten.tsx)

- InfoRow Icon-Container: `bg-primary/10 rounded-xl` mit primary-farbigem Icon
- StatCard: gefuellter Icon-Container `bg-primary text-white rounded-xl`
- Groessere Zahlen in StatCards

### 7. Summary-Komponenten (DashboardReviewsSummary.tsx, DashboardPayoutSummary.tsx)

- Icon-Container: `bg-primary text-white rounded-xl` statt `bg-primary/10`
- Cards: `rounded-2xl shadow-md`

## Technische Details

### Sidebar Nav-Item aktiver State

```
// Vorher (kaum sichtbar):
activeClassName="bg-primary/[0.08] text-primary font-medium"

// Nachher (solide Pill wie Attendflow):
activeClassName="bg-primary text-white font-medium shadow-md"
```

### Stat-Card Label + Wert

```
// Vorher:
<CardTitle className="text-sm font-medium text-muted-foreground">
<div className="text-3xl font-bold">

// Nachher (Attendflow uppercase labels):
<CardTitle className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
<div className="text-4xl font-extrabold">
```

### Icon-Container

```
// Vorher:
<div className="w-10 h-10 rounded-xl bg-primary/10">
  <Icon className="text-primary" />

// Nachher (gefuellt wie Attendflow):
<div className="w-10 h-10 rounded-xl bg-primary shadow-md shadow-primary/20">
  <Icon className="text-white" />
```

### Content-Hintergrund

```
// Vorher:
<main className="flex-1 p-6 lg:p-8 bg-accent/30">

// Nachher:
<main className="flex-1 p-6 lg:p-8 bg-slate-50">
```

### Betroffene Dateien

1. `src/components/mitarbeiter/MitarbeiterSidebar.tsx` - Gefuellte Nav-Pills
2. `src/components/mitarbeiter/MitarbeiterLayout.tsx` - Header + Content-Background
3. `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` - Stat-Cards + Auftrags-Cards
4. `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx` - Card-Styling
5. `src/pages/mitarbeiter/MitarbeiterBewertungen.tsx` - Card-Styling
6. `src/pages/mitarbeiter/MeineDaten.tsx` - Icon-Container + StatCards
7. `src/components/mitarbeiter/DashboardReviewsSummary.tsx` - Icon + Card-Styling
8. `src/components/mitarbeiter/DashboardPayoutSummary.tsx` - Icon + Card-Styling

Keine neuen Abhaengigkeiten. Rein visuelle Aenderungen. Die CSS-Variablen in index.css bleiben unveraendert, damit das Admin-Panel nicht beeinflusst wird.

