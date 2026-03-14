

# Optisches Upgrade des Admin-Panels

Basierend auf dem Referenz-Screenshot (MagicVics Panel) werden folgende visuelle Verbesserungen umgesetzt. Keine Funktionen oder Workflows werden geändert.

## Referenz-Analyse

Das Referenz-Panel hat: dunkle Sidebar (dunkelblau/schwarz), farbige Top-Borders an Stat-Cards (blau, gruen, lila, rot, gelb), Suchleiste im Header, Avatar + Notification-Icons im Header, farbige Badge-Zähler in der Sidebar, großzügigere Abstände, premium Schriftgewichte.

## Geplante Änderungen

### 1. Dunkle Sidebar (`AdminSidebar.tsx` + `index.css`)
- Sidebar bekommt dunklen Hintergrund (slate-900/950)
- Nav-Text wird hell (slate-300), aktiver State wird ein farbiger Pill (primary-Hintergrund, weißer Text)
- Gruppenüberschriften in gedämpftem Weiß (uppercase, smaller)
- Badge-Zähler in farbigen Kreisen (rot/orange) statt default
- Footer-Bereich mit Avatar-Kreis + Email
- CSS-Variablen für `--sidebar-background`, `--sidebar-foreground` etc. anpassen

### 2. Premium Header (`AdminLayout.tsx`)
- Höherer Header (h-16 statt h-14)
- Suchleiste in der Mitte (visuell, Platzhalter "Suchen...")
- Rechte Seite: Notification-Bell-Icon, Settings-Icon, Avatar-Kreis mit Initiale
- Subtiler Bottom-Shadow

### 3. Dashboard Stat-Cards (`AdminDashboard.tsx`)
- Farbiger Top-Border (4px) pro Card (blau, grün, orange, violett, rosa) — wie im Referenz-Panel
- Größere Icon-Container mit stärkeren Farben
- Subtilere Hover-Animation (scale + shadow)

### 4. Tabellen-Styling (globale Verbesserung in `index.css`)
- Abgerundete Tabellencontainer
- Alternating Row Colors (zebra-striping sehr dezent)
- Hover-Highlight auf Rows
- Badges mit stärkeren Farben und abgerundeten Pills

### 5. Allgemeine Polish (`index.css`)
- Leicht getönter Seitenhintergrund (slate-50 statt reines Weiß)
- Stärkere Card-Schatten (shadow-md statt shadow-sm)
- Smoothere Transitions global

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/index.css` | Sidebar CSS-Variablen auf dunkle Farben, Tabellen-Styling, Background-Tint |
| `src/components/admin/AdminSidebar.tsx` | Dunkle Klassen, farbige aktive States, farbige Badges, Avatar im Footer |
| `src/components/admin/AdminLayout.tsx` | Premium Header mit Suchleiste, Icons, Avatar |
| `src/pages/admin/AdminDashboard.tsx` | Farbige Top-Border auf Stat-Cards, größere Icons, bessere Hover |

