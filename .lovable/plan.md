

# Auth-Seite (/auth) optisch aufbessern

## Aktueller Stand
Split-Screen mit Branding-Panel links (Gradient + Trust-Points) und Login-Formular rechts. Funktional solide, aber das Formular wirkt noch plain — keine Card, kein visueller Rahmen, Standard-Inputs ohne Icons, kein Fokus-Akzent.

## Geplante Verbesserungen

### Rechte Seite (Login-Formular)
- **Form in eine Card wrappen**: Subtiler `shadow-lg`, `rounded-2xl`, `border` — hebt das Formular vom Hintergrund ab
- **Input-Felder mit Icons**: Mail-Icon im E-Mail-Feld, Lock-Icon im Passwort-Feld (als Prefix innerhalb des Inputs via relative/absolute Positionierung)
- **Passwort anzeigen/verbergen**: Eye/EyeOff Toggle-Button rechts im Passwort-Input
- **Login-Button**: `shadow-sm hover:shadow-md transition-all` + leichter Hover-Scale, konsistent mit dem Admin-Panel-Button-Konzept
- **Hintergrund**: Sehr subtiles Pattern oder leichter Gradient (`bg-gradient-to-br from-background to-muted/30`) statt flachem `bg-background`
- **Willkommen-Text**: Größerer Titel (`text-3xl`), Subtitel mit mehr Abstand

### Linke Seite (Branding-Panel)
- **Logo größer**: `max-h-20` statt `max-h-16`
- **Trust-Point Icons**: Leichte Animationspulse auf Hover entfernen (da `backdrop-blur-sm` Lag verursachen kann) — stattdessen `opacity`-Transition
- **Entferne `backdrop-blur-sm`** von den Trust-Point-Cards (Performance, konsistent mit der Popup-Optimierung)

### Mobile
- **Mobile Logo**: Card-Wrapper auch hier anwenden
- **Subtilere mobile Darstellung**: Brandingfarbe als Akzentlinie über dem Formular

### Betroffene Datei
- `src/pages/Auth.tsx` — einzige Datei

