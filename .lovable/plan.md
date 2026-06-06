# /auth Redesign — Premium Split-Screen

Layout-Struktur bleibt identisch (links Branding-Panel, rechts Formular). Die visuelle Qualität wird auf ein modernes, premium SaaS-Niveau gehoben. Branding-Primärfarbe (`brandingColor`) bleibt die tragende Akzentfarbe pro Domain.

## Designrichtung (auto gewählt)

- **Stil**: Dark Premium links, Light Clean rechts. Kein flacher Gradient mehr — stattdessen animiertes Mesh-Gradient + dezente Particles/Beams + Glassmorphism-Karten.
- **Typografie**: Headlines `Instrument Serif` (editorial, premium), Body `Work Sans`. Wird via `@fontsource` installiert.
- **Branding-Wahrung**: Linke Panel-Basisfarbe basiert weiterhin auf `--primary` (Domain-Branding), aber als tiefer Dark-Tone (`hsl(var(--primary)) ` über mehrlagige Gradient-Layer) mit `radial-gradient` Mesh statt linearem Verlauf.

## Linkes Panel (Branding)

- Hintergrund: Mehrschichtiges Mesh — `radial-gradient` Spots in Primary/Primary-Glow + sehr dunklem Base + animierter `bg-[length:200%_200%]` Drift (8s Loop)
- Subtiler Noise-Overlay (CSS SVG, ~3% Opacity) für „Filmkorn"-Premium-Feel
- Animated Beam / Light Ray diagonal über das Panel (CSS pseudo-element + blur)
- Logo: in einer dezent leuchtenden Glas-Plakette (`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6`), darunter Eyebrow-Label „MITARBEITERPORTAL" mit `tracking-[0.3em] text-xs uppercase`
- Headline „Willkommen zurück." in Serif, groß, mit `bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent`
- Trust-Points als Bento-Style Karten: 3 Karten, alternierende Größen, mit Icon im quadratischen Gradient-Tile, Border-Glow on hover, gestaffelte framer-motion Entry
- Footer-Zeile unten: kleines „Made with care · DSGVO" mit Status-Dot (pulsing green)

## Rechtes Panel (Formular)

- Statt purem `bg-background`: subtiler vertikaler Verlauf + dezenter Dot-Pattern Hintergrund (sehr leise)
- Form-Container: max-w-md, leicht erhobene Karte (`bg-card/60 backdrop-blur-sm border border-border/50 shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.15)] rounded-3xl p-10`)
- Tab-Switcher: Pill-Style (segmented control) statt Underline — `bg-muted rounded-full p-1`, aktiver Tab `bg-background shadow-sm`
- Inputs: höher (`h-12`), `rounded-xl`, Icon links (Mail, Lock, User, Phone), Focus-Ring in Primary mit `ring-offset-2`, sanfter Hover-Shadow
- Passwort-Felder: Show/Hide Toggle (Eye-Icon rechts)
- Bei Register: 2-Spalten Grid für Vorname/Nachname bleibt, Passwort-Stärke-Indikator (kleine 3-Segment Bar unter Passwort)
- Button: `h-12 rounded-xl bg-primary` mit dezentem Gradient-Sheen on hover (gradient overlay `from-primary to-primary/80`), Lade-Spinner statt nur Text
- Footer-Hint unter Form: „Probleme beim Anmelden? Support kontaktieren" als ghost link
- Mobile: linkes Panel verschwindet, Logo + Headline kompakt oben, Form-Karte zentriert

## Motion

- framer-motion: gestaffeltes Fade-Up für Trust-Cards (`delay: 0.15 * i`)
- Mesh-Gradient: CSS `@keyframes` Drift (background-position Animation)
- Hover auf Trust-Cards: `whileHover={{ y: -4 }}`
- Tab-Wechsel: `AnimatePresence` mode="wait" für Form-Inhalt mit `opacity` + `x` Slide

## Dateien

- `src/pages/Auth.tsx` — komplette Neugestaltung (Logik 1:1 erhalten: handleLogin, handleRegister, branding fetch, navigation, sendEmail/sendTelegram). Nur JSX + Styles ändern sich.
- `src/main.tsx` — `@fontsource/instrument-serif` + `@fontsource/work-sans` Imports
- `tailwind.config.ts` — fontFamily `serif: ['Instrument Serif', ...]`, ggf. neue keyframes für Mesh-Drift
- `src/index.css` — `@keyframes mesh-drift`, evtl. Utility-Class für Noise-Overlay
- `package.json` — `bun add @fontsource/instrument-serif @fontsource/work-sans`

## Was nicht angefasst wird

- AuthContext, useUserRole, sendEmail/sendTelegram Logik
- Branding-Resolution (Domain → Logo/Color/ID)
- Registrierungs-Flow (Profile-Update, Contract-Insert, Notifications)
- Routen und Redirects
