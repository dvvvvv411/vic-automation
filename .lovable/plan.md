

# Scrollbar modernisieren auf Bewerbungsgespräch-Seite

## Problem
Die Uhrzeitauswahl nutzt `overflow-y-auto` mit der Browser-Default-Scrollbar — sieht veraltet aus.

## Lösung
Inline-CSS für custom Scrollbar in Branding-Farbe direkt auf dem `div` mit `max-h-[340px]`. Verwende CSS-Klasse oder inline `style` mit `scrollbarColor` und Webkit-Pseudo-Elemente via einer kleinen CSS-Klasse.

Da `brandColor` dynamisch ist, erstelle einen `style`-Tag oder nutze inline `scrollbarColor: \`${brandColor}66 transparent\`\` plus eine dynamische CSS-Klasse für Webkit-Browser.

### Änderung in `Bewerbungsgespraech.tsx`
- Zeile 501: Dem Time-Slot-Container ein `style`-Attribut mit `scrollbarWidth: 'thin'` und `scrollbarColor` (brandColor-basiert) hinzufügen
- Einen kleinen `<style>`-Block für Webkit-Scrollbar-Styling mit brandColor als CSS-Variable einfügen

