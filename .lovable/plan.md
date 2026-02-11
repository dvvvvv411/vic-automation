

# Redesign: Helles, professionelles Fintech-Theme

## Problem

Das gesamte Design verwendet aktuell ein dunkles Theme mit nahezu schwarzem Hintergrund -- das passt nicht zu einem serioesen deutschen Fintech-Unternehmen. Die Auth-Seite und die Dashboards wirken zu einfach und unausgereift.

## Was sich aendert

### 1. Globales Light-Theme (src/index.css)

Alle CSS-Variablen werden auf ein helles, professionelles Farbschema umgestellt:

- **Hintergrund**: Reines Weiss / sehr helles Grau statt Fast-Schwarz
- **Vordergrund**: Dunkles Anthrazit fuer Text statt Hellgrau
- **Cards**: Weiss mit dezenten Schatten
- **Borders**: Zartes Grau statt Dunkelgrau
- **Primary**: Blau bleibt, wird aber auf hellem Hintergrund kraeftiger wirken
- **Muted-Toene**: Helle Grau-Abstufungen
- **Font**: Wechsel auf "Inter" -- die Standard-Schrift fuer professionelle SaaS/Fintech-Produkte

### 2. Auth-Seite komplett neu (src/pages/Auth.tsx)

Statt einer einfachen zentrierten Card wird ein **Split-Screen-Layout** gebaut:

```text
+---------------------------+----------------------------+
|                           |                            |
|   LINKE SEITE             |    RECHTE SEITE            |
|   (Blauer Gradient)       |    (Weisses Formular)      |
|                           |                            |
|   - Logo "Vic Automation" |    - Tabs: Anmelden /      |
|   - Claim-Text            |      Registrieren          |
|   - 3 Trust-Punkte:       |    - E-Mail Input          |
|     * Enterprise Security |    - Passwort Input        |
|     * DSGVO-konform       |    - Senden-Button         |
|     * Seit 2026           |    - Trenner "oder"        |
|                           |    - Sekundaerer Link      |
|   - Dezentes Muster       |                            |
|     (geometrisch)         |                            |
|                           |                            |
+---------------------------+----------------------------+
```

Design-Details:
- Linke Seite: Blau-Gradient von Dunkelblau nach Mittelblau mit dezenten geometrischen Kreisen
- Rechte Seite: Reinweisser Hintergrund, grosszuegige Abstande, klare Typografie
- Inputs: Groesser (h-12), abgerundeter (rounded-lg), mit sanftem Grau-Rand
- Button: Volle Breite, groesser (h-12), mit Hover-Effekt
- Trust-Indikatoren auf der linken Seite (Shield-Icon, CheckCircle, Building)
- Responsiv: Auf Mobile wird die linke Seite ausgeblendet, nur das Formular bleibt

### 3. Admin-Dashboard aufgewertet (src/pages/Admin.tsx)

- Weisser Hintergrund statt Fast-Schwarz
- Header: Weiss mit dezenter unterer Border und klarem Shadow
- Statistik-Cards: Weiss, dezenter Ring-Border, sanfter Shadow, farbiger Icon-Hintergrund (blaue Kreise hinter den Icons)
- Professionellere Begruessung ohne Emojis
- Bessere visuelle Hierarchie und Abstande

### 4. Mitarbeiter-Dashboard aufgewertet (src/pages/Mitarbeiter.tsx)

- Gleiche Verbesserungen wie Admin
- Weisser Hintergrund, professionelle Cards
- Kein Emoji in der Begruessung
- Farbige Icon-Hintergruende fuer die Statistik-Karten

### 5. Landing Page anpassen (src/pages/Index.tsx)

- Heller Hintergrund statt Schwarz
- Dezenter blauer Glow-Effekt auf Weiss
- Dunkler Text, blaues "2.0"

---

## Technische Details

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `src/index.css` | Alle CSS-Variablen auf Light-Theme, Font auf Inter |
| `src/pages/Auth.tsx` | Komplett neues Split-Screen-Layout mit professionellem Fintech-Design |
| `src/pages/Admin.tsx` | Helles Theme, bessere Cards, professionellere Gestaltung |
| `src/pages/Mitarbeiter.tsx` | Helles Theme, bessere Cards, professionellere Gestaltung |
| `src/pages/Index.tsx` | Anpassung an helles Theme |

### Keine neuen Abhaengigkeiten

Alles wird mit den bestehenden Libraries (Tailwind, Framer Motion, Lucide Icons, Shadcn/UI) umgesetzt.

### Keine Datenbankzaenderungen

Rein visuelles Update -- Auth-Logik, Rollen und Routing bleiben identisch.
