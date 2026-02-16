
# Mitarbeiter-Panel im Attendflow-Style ueberarbeiten (Helles Theme)

## Designrichtung

Attendflow nutzt eine cleane, helle SaaS-Aesthetik: weisse Flaechen, minimale Farben, subtile Borders, sanfte Schatten, grosszuegige Abstande, professionelle Typografie. Kein dunkler Sidebar -- alles bleibt hell und aufgeraeumt.

## Aenderungen

### 1. Sidebar (MitarbeiterSidebar.tsx)
- Heller Hintergrund beibehalten (`bg-white`), cleaner Look
- Nav-Items: schlichtere Hover-States mit `bg-slate-50`, aktiver State als sanfter `bg-primary/8 text-primary` Pill ohne border-left
- Logo-Bereich: sauberer mit mehr Padding, feinere Trennlinie
- Footer: minimalistischer, cleanere User-Info
- Abmelden-Button feiner gestaltet

### 2. Layout/Header (MitarbeiterLayout.tsx)
- Header erweitern: Seitentitel links (neben Sidebar-Trigger), User-Info rechts (E-Mail + Avatar)
- Cleanere Trennlinie (`border-border/30`)
- Leicht hellerer Hintergrund fuer Content-Bereich (`bg-slate-50/50`)

### 3. Dashboard (MitarbeiterDashboard.tsx)
- Stat-Cards: Weissere Karten, feinere Borders (`border-border/50`), keine backdrop-blur oder ring, kein bg-card/80
- Icon-Container: schlichter, einfarbig `bg-primary/10` ohne Gradient
- Gradient-Leiste oben an Order-Cards entfernen, stattdessen subtilerer linker Farbstreifen oder gar keiner
- Hover-Effekte zurueckfahren: nur `hover:shadow-md`, keine translate-y
- Praemien-Badge cleaner ohne rounded-full pill

### 4. Auftraege (MitarbeiterAuftraege.tsx)
- Gleiche Card-Vereinfachung: weisser Hintergrund, feine Borders, sanfte Schatten
- Gradient-Leiste entfernen
- Cleaner, minimalistischer Look

### 5. Bewertungen (MitarbeiterBewertungen.tsx)
- Gradient-Leiste entfernen
- Schlichtere Cards

### 6. Meine Daten (MeineDaten.tsx)
- Info-Rows: Icon-Container in `bg-slate-100` statt bg-muted
- Bankkarte beibehalten (sieht bereits gut aus)
- StatCards schlichter

### 7. Summary-Komponenten (DashboardReviewsSummary.tsx, DashboardPayoutSummary.tsx)
- Vereinfachung: kein ring-1, kein backdrop-blur, kein bg-card/80
- Stattdessen: `bg-white border border-border/50 shadow-sm rounded-xl`

## Technische Details

### Wiederkehrendes Card-Pattern (vorher vs. nachher)

Vorher:
```
border border-border/40 ring-1 ring-border/10 shadow-sm bg-card/80 backdrop-blur-sm rounded-2xl
```

Nachher:
```
bg-white border border-border/50 shadow-sm rounded-xl hover:shadow-md transition-shadow
```

### Sidebar Nav-Item (vorher vs. nachher)

Vorher:
```
bg-primary/10 text-primary font-medium shadow-sm border-l-[3px] border-primary
```

Nachher:
```
bg-primary/8 text-primary font-medium rounded-lg
```

### Betroffene Dateien
1. `src/components/mitarbeiter/MitarbeiterSidebar.tsx`
2. `src/components/mitarbeiter/MitarbeiterLayout.tsx`
3. `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`
4. `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`
5. `src/pages/mitarbeiter/MitarbeiterBewertungen.tsx`
6. `src/pages/mitarbeiter/MeineDaten.tsx`
7. `src/components/mitarbeiter/DashboardReviewsSummary.tsx`
8. `src/components/mitarbeiter/DashboardPayoutSummary.tsx`

Keine neuen Abhaengigkeiten. Rein visuelle Aenderungen (Tailwind-Klassen), keine Logik-Aenderungen.
