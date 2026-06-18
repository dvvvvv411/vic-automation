## Umsetzung — Auth-Redesign „Card-Container mit Logo"

Strukturell 1:1 wie der gewählte Prototyp v1, aber mit dynamischen Branding-Daten (`logo_url`, `company_name`, `brand_color`) statt fixen Platzhaltern. Funktionalität (Login, Registrierung, Branding-Resolution, Profile-Update, Contract-Insert, `sendEmail konto_erstellt`, `sendTelegram`, Redirect-`useEffect`) bleibt unverändert.

## Layout

- Außen: `min-h-screen` zentriert auf `bg-slate-50`, mit `p-4 md:p-8`.
- Innen: Card-Container `max-w-6xl` mit `shadow-2xl rounded-3xl overflow-hidden`, zweispaltig ab `md`.

### Linkes Hero-Panel (md+)

- `bg-primary` (statt hartkodiertem Blau), dezente Blob-Decorations (white/5, primary-glow/20) für Tiefe.
- **Branding-Header oben**:
  - `branding.logo_url` als `<img>` mit `max-h-10`. Falls Logo dunkel ist → optionaler weiß-invert per CSS-Filter (wie bestehende `for-tel.solutions` Logik beibehalten).
  - Vertikaler Divider, daneben kleiner Wordmark `branding.company_name` in uppercase/tracking-wider.
  - Fallback ohne Logo: nur Wordmark.
- **Hero-Content**: Pill-Badge mit Shield-Icon „Enterprise Security Platform" (generischer Text), Headline „Mitarbeiterportal für moderne App-Sicherheit." (fix), Beschreibungs-Paragraph (fix).
- **3 Feature-Tiles** (grid-cols-3, `bg-white/10 backdrop-blur-md rounded-2xl border-white/10`) mit Lucide-Icons (`Smartphone`, `ClipboardList`, `FileText`).
- **Testimonial-Box unten**: `bg-white/5 rounded-2xl p-6`, 5 gefüllte gelbe Sterne, Zitat, „— Lead Security Engineer, Fortune 500".
- **Copyright-Zeile**: `© {currentYear} {company_name}. Alle Rechte vorbehalten.`

### Rechtes Form-Panel

- Weißer Hintergrund, `p-12 md:p-20`, `flex-col justify-between`.
- **Brand-Anchor oben** (linksbündig auf md+, zentriert mobil):
  - `branding.logo_url` als `<img>` mit `max-h-12 w-auto`.
  - Darunter Wordmark `branding.company_name` (uppercase, tracking-widest, text-slate-400).
- **Heading**: „Anmelden" / Sub „Willkommen zurück. Melde dich mit deinem Konto an."
- **Login-Form**:
  - Email-Input mit `Mail`-Icon-Prefix, `rounded-2xl bg-slate-50` Style.
  - Passwort-Input mit `Lock`-Prefix + `Eye`/`EyeOff`-Toggle (State `showPassword`).
  - Reihe: Checkbox „Angemeldet bleiben" (rein visuell) + Link „Passwort vergessen?" (no-op).
  - Primärer Submit-Button (`bg-primary`, `LogIn`-Icon, `shadow-xl shadow-primary/20`).
- **Divider „Oder"** + Sub „Noch kein Mitarbeiterzugang?" + Outline-Button „Jetzt registrieren →" → toggelt auf Register-State.
- **Register-State**: gleicher Container, Felder Vorname/Nachname (2-col), E-Mail, Handynummer, Passwort, Passwort bestätigen mit Icon-Prefixes (`User`, `Mail`, `Phone`, `Lock`). Outline-Button „← Zurück zur Anmeldung" unten.
- **Disclaimer**: „Durch die Registrierung stimmst du unseren Nutzungsbedingungen zu."
- **Footer-Links unten** (mt-auto): „Impressum · Datenschutz" (no-op `<a>`).

## Mobile

- Linkes Panel `hidden md:flex`.
- Über dem Formular: Brand-Anchor mit Logo bleibt zentriert sichtbar.

## Tokens

- Keine `bg-blue-*` Klassen — stattdessen `bg-primary`, `text-primary`, `text-primary-foreground`, Ring/Focus mit `ring-primary/10`.
- `--primary` wird weiter per Inline-Style auf dem Page-Wrapper aus `brandingColor` via `hexToHSL` gesetzt (wie heute).
- `text-muted-foreground`, `border-border` für neutrale Elemente.

## Animation

- Bestehende `framer-motion` Fade-/Slide-Animationen für Brand-Header, Headline, Tiles und Form leicht weiterverwenden.

## Funktional unverändert

- `fetchBranding` (Domain → custom_email_link → Fallback) bleibt.
- `handleLogin` / `handleRegister` (inkl. `profiles.update branding_id`, `employment_contracts.insert`, `sendEmail konto_erstellt`, `sendTelegram konto_erstellt`) bleibt.
- Redirect-`useEffect` bleibt.
- `--primary` via Inline-Style (keine Mutation von `documentElement`).

## Out of scope

- „Passwort vergessen?" Flow — nur Link-Stub.
- „Angemeldet bleiben" — rein visuell (Supabase persistiert ohnehin).
- Impressum/Datenschutz-Routen — nur Link-Stubs.

## Betroffene Dateien

- `src/pages/Auth.tsx` — JSX-Rewrite nach Prototyp v1, Logik unverändert. Neue Lucide-Icons: `Mail`, `Lock`, `Eye`, `EyeOff`, `User`, `Phone`, `Shield`, `Smartphone`, `ClipboardList`, `FileText`, `Star`, `ArrowRight`, `ArrowLeft`, `LogIn`.
- Keine weiteren Dateien, keine DB/Tailwind/CSS-Änderungen.
