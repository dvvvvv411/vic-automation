
# Modernisierung des Mitarbeiter-Panels: Sidebar und Cards

## Uebersicht

Das Mitarbeiter-Panel bekommt ein visuell hochwertiges Upgrade mit glassmorphism-inspirierten Elementen, verfeinerten Spacing-Werten, subtilen Gradienten und eleganteren Interaktionseffekten.

---

## 1. Sidebar modernisieren

**Datei**: `src/components/mitarbeiter/MitarbeiterSidebar.tsx`

Aenderungen:
- **Navigation-Items**: Groessere Touch-Targets (`py-3`), groessere Icons (`h-5 w-5`), verfeinerte aktive States mit einem linken Akzent-Indikator statt nur Hintergrundfarbe
- **Aktiver State**: Links ein 3px-Primary-Border als visueller Indikator, staerkerer Hintergrund (`bg-primary/10`), leichter Schatten
- **Hover-Effekte**: Sanftere Uebergaenge, dezenter Hintergrundwechsel mit Skalierung
- **Footer-Bereich**: User-Email mit einem kleinen Avatar-Kreis (Initiale), sauberer Abmelden-Button mit Hover-Rot-Effekt
- **Spacing**: Mehr Luft zwischen den Nav-Items (`gap-1`), Logo-Bereich mit mehr Padding

## 2. Stats-Cards modernisieren

**Datei**: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`

Aenderungen:
- **Glassmorphism-Effekt**: `backdrop-blur-sm` mit leicht transparentem Hintergrund (`bg-card/80`)
- **Groessere Icon-Container**: `w-12 h-12 rounded-2xl` mit Gradient statt flacher Farbe (`bg-gradient-to-br from-primary/20 to-primary/5`)
- **Border**: Subtilerer Border mit `border-border/40`, dazu ein feiner `ring-1 ring-border/10` fuer Tiefe
- **Hover**: Staerkerer Lift-Effekt (`hover:-translate-y-1`), sanfter Glow-Shadow (`hover:shadow-primary/5`)
- **Werte**: Groessere Schrift fuer den Hauptwert (`text-4xl`), farblich abgestimmter Detail-Text

## 3. Auftrags-Cards modernisieren

**Dateien**: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` und `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`

Aenderungen:
- **Top-Accent**: Dickerer Gradient-Streifen am oberen Rand (`h-1.5` statt `h-1`), mit `rounded-t-lg`
- **Interne Trenner**: Feine horizontale Linie (`border-b border-border/30`) zwischen Infobereichen
- **Praemie-Hervorhebung**: Groesserer, fetter Text mit leichtem Primary-Hintergrund-Pill (`bg-primary/10 rounded-full px-3 py-1`)
- **Buttons**: Abgerundeter (`rounded-xl`), mit Gradient-Hintergrund fuer den primaeren Button
- **Store-Links**: Modernere Pill-Buttons mit Icon

## 4. Header modernisieren

**Datei**: `src/components/mitarbeiter/MitarbeiterLayout.tsx`

Aenderungen:
- **Header**: `backdrop-blur-md bg-card/80` fuer einen glassmorphism-Effekt, kein harter Schatten sondern subtiler Border
- **Hoehe**: Etwas groesser (`h-16` statt `h-14`)

## 5. Empty State modernisieren

- Groesseres Icon mit Gradient-Hintergrund
- Subtilerer gestrichelter Border mit mehr Rundung

---

## Technische Details

Alle Aenderungen sind rein visuell (CSS/Tailwind-Klassen). Keine Logik-Aenderungen, keine neuen Abhaengigkeiten. Die Dateien die angepasst werden:

1. `src/components/mitarbeiter/MitarbeiterSidebar.tsx` -- Nav-Items, Footer, Spacing
2. `src/components/mitarbeiter/MitarbeiterLayout.tsx` -- Header glassmorphism
3. `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` -- Stats-Cards, Order-Cards, Empty State
4. `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx` -- Order-Cards (gleicher Stil wie Dashboard)
