

# Auth-Seite: Linke Spalte ueberarbeiten

## Aenderungen

### 1. Helleres, lebendigeres Blau
Der Gradient wird aufgehellt -- von `hsl(217,91%,25%)` / `hsl(217,91%,50%)` auf ein frischeres, lebendigeres Blau (z.B. `from-[hsl(217,80%,55%)] to-[hsl(210,90%,65%)]`). Zusaetzlich wird ein subtiler dritter Farbton eingemischt (`via-[hsl(220,85%,60%)]`), damit der Hintergrund lebendiger wirkt.

### 2. Lebendigerer Hintergrund
- Die bestehenden geometrischen Kreise (border-only) werden durch groessere, weichere Kreise mit staerkerem `bg-white/10` ersetzt und teilweise mit Blur-Effekten versehen (`blur-2xl`, `blur-3xl`), sodass ein moderner Glasmorphismus-Effekt entsteht.
- Zusaetzliche dekorative Elemente sorgen fuer mehr Tiefe.

### 3. Texte und Trust-Points neutralisieren
- **Titel**: "Vic Automation 2.0" bleibt, aber der Untertitel aendert sich von "Professionelle App-Testing Plattform" zu etwas Neutralem wie "Ihr Mitarbeiterportal".
- **Trust-Points** werden angepasst:
  - "Enterprise Security" -> "Sicherer Zugang" mit Beschreibung "Geschuetzter Mitarbeiterbereich"
  - "DSGVO-konform" bleibt (ist allgemein genug)
  - "Seit 2026 -- Deutsches Qualitaetsunternehmen" -> "Einfach & Schnell" mit Beschreibung "Alle Infos an einem Ort"
- Kein Hinweis mehr auf "App-Testing" irgendwo auf der Seite.

### 4. Mobiler Logo-Bereich
Der mobile Untertitel "App-Testing Plattform" wird ebenfalls zu "Mitarbeiterportal" geaendert.

## Technische Details

**Datei**: `src/pages/Auth.tsx`

- `trustPoints`-Array: Texte anpassen (3 Eintraege bleiben, nur Inhalte aendern)
- Gradient-Klassen im `div` der linken Spalte aendern
- Dekorative Elemente: Klassen fuer Groesse, Opacity und Blur anpassen
- Untertitel-Texte in JSX aendern

Keine neuen Dateien oder Abhaengigkeiten noetig.

