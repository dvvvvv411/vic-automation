## Auth-Seite: Logo entfernen + Branding-Name im Badge

### Änderungen

1. **Logo oben links entfernen**
   - In `src/pages/Auth.tsx` den Branding-Header im Hero-Panel (linke Hälfte oben) entfernen.
   - Der Bereich mit Logo + Trennstrich + Unternehmensname wird komplett gestrichen.

2. **Badge-Text anpassen**
   - Der Badge "Enterprise Security Platform" im Hero-Content wird durch den dynamischen `brandingCompany`-Namen ersetzt.
   - Das Shield-Icon bleibt erhalten.

### Betroffene Datei
- `src/pages/Auth.tsx` (Zeilen ~205–221 und ~230)