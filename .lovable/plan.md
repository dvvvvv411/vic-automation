

# Bewerbungsgespräch-Seite modernisieren

## Aktuelle Situation
Die Seite ist funktional sauber, aber optisch schlicht — flache weiße Cards, keine Farbakzente, keine Animationen. Im Vergleich zum Admin-Panel fehlen Gradient-Header, farbige Akzente, motion-Animationen und der Premium-Look.

## Geplante Änderungen

### 1. Booking-Seite aufwerten
- **Card mit Gradient-Header**: Oben ein farbiger Gradient-Streifen (basierend auf `brandColor`) mit Titel + Beschreibung in Weiß
- **Applicant-Pills modernisieren**: Leicht farbig getönte Badges statt grauem `bg-slate-100`, mit subtiler Border
- **Calendar-Bereich**: Leichte Hintergrundfarbe, abgerundete Container
- **Time-Slot-Buttons**: Hover-Effekte verbessern, ausgewählter Slot mit Schatten + Scale-Effekt
- **Book-Button**: Gradient statt flat color, `hover:scale` + `shadow-lg`
- **Motion-Animationen**: `framer-motion` für Card-Entrance, Slot-Liste und Button-Erscheinen

### 2. Bestätigungs-Ansicht aufwerten
- Größerer Success-Icon mit Puls-Animation
- Termin-Info-Box mit farbigem Left-Border (brandColor)
- Telefon-Hinweis mit Icon-Badge statt flachem Layout
- Confetti-artige Checkmark-Animation beim Laden

### 3. Error/Loading States
- Loading: Skeleton-Shimmer statt einfachem Text
- Error: Farbiger Alert mit Icon-Badge

### 4. Allgemeines Styling
- Background: `from-slate-50 via-blue-50/20 to-indigo-50/30` (reicherer Gradient)
- Card: `shadow-xl` statt `shadow-md`, `border-0` für cleaner Look
- Logo: Größer (h-12) mit subtle Shadow
- Footer: Dezenter mit Separator-Linie

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `Bewerbungsgespraech.tsx` | Komplettes visuelles Upgrade — Styling, Animationen, Gradient-Header |

