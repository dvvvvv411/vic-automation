# Auth-Seite: Testimonial durch Branding-Homepage-Link ersetzen

## Ziel
Das Sterne-/Zitat-Testimonial am unteren Rand des linken Hero-Panels wird entfernt und durch ein interaktives Element ersetzt, das den Nutzer zur öffentlichen Branding-Startseite führt.

## Visualisierung

````text
┌────────────────────────────────────────────┐
│  Linke Spalte (bg-primary) – unterer Teil  │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │  [   BRANDING LOGO   ]             │    │
│  │        (max-h-14)                  │    │
│  │                                    │    │
│  │  Du möchtest mehr erfahren?        │    │
│  │                                    │    │
│  │  ┌────────────────────────────┐    │    │
│  │  │  www.for-tel.solutions   → │    │    │
│  │  └────────────────────────────┘    │    │
│  │         (glass-button)             │    │
│  └────────────────────────────────────┘    │
│                                            │
│  © 2026 For-Tel Solutions. Alle Rechte ... │
└────────────────────────────────────────────┘
````

## Design-Details des neuen Elements

**Container:**
- `mb-8 p-6 bg-white/5 rounded-2xl border border-white/5`
- Gleiche Basis-Styling wie das alte Testimonial, damit es visuell harmoniert

**Inhalt (top → bottom):**
1. **Branding-Logo** – `brandingLogoUrl` mit `max-h-14 w-auto object-contain` und `logoInvertClass` (für dunkle Logos auf hellem Hintergrund). Falls kein Logo vorhanden: `brandingCompany` als Headline.
2. **Hinweistext** – `"Du möchtest mehr erfahren?"` in `text-sm opacity-90 font-medium`
3. **CTA-Button/Link** – Ein klickbarer Button/Pill im Glassmorphism-Stil:
   - `bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-2.5`
   - Text: Domain-Hostname (z.B. `www.for-tel.solutions`)
   - Rechts ein `ArrowRight` Icon
   - Öffnet `https://{brandingDomain}` in neuem Tab (`target="_blank" rel="noopener noreferrer"`)
   - Falls `brandingDomain` leer: Button wird nicht gerendert, stattdessen neutraler Hinweis.

## Technische Details

**Datei:** `src/pages/Auth.tsx`  
**Zeilen:** 266–279 (Testimonial-Block)

**Benötigte Daten (bereits vorhanden):**
- `brandingLogoUrl` – Logo-URL
- `brandingDomain` – Root-Domain (ohne Subdomain, z.B. `for-tel.solutions`)
- `brandingCompany` – Firmenname
- `logoInvertClass` – Filter-Klasse für dunkle Logos

**Imports:** `ArrowUpRight` (oder `ArrowRight` bereits vorhanden) aus `lucide-react` hinzufügen.

**Keine Änderungen an:** Rechte Spalte, Auth-Logik, Branding-Fetch, Farb-System.