
Ziel: Das Mitarbeiter-Panel darf erst sichtbar werden, wenn Branding-Farbe, Logo und Vertragsstatus vollständig bereit sind. Bis dahin nur ein neutraler Ladebildschirm – kein blaues Default-UI, kein kurzes Aufblitzen von Sidebar/Logo.

## Was ich ändern würde

### 1. `src/components/mitarbeiter/MitarbeiterLayout.tsx`
Die bisherige Logik reicht nicht, weil `loading` schon auf `false` geht, bevor die Branding-Farbe wirklich im DOM aktiv ist.

Geplante Anpassung:
- Einen echten `panelReady`/`brandingReady`-Schritt einführen
- Contract + Branding laden
- `brand_color` sofort in HSL umrechnen
- Logo vorab preladen (`new Image()`)
- Erst wenn
  - Contract/Branding geladen,
  - Branding-Farbe vorbereitet,
  - Logo geladen/fehlgeschlagen
  sind, wird das Panel gerendert
- Bis dahin: Fullscreen-Loading-Screen

Wichtig:
- Die Branding-Farbe nicht mehr erst in einem normalen `useEffect` nachträglich setzen
- Stattdessen vor dem ersten sichtbaren Render anwenden:
  - entweder über `useLayoutEffect`
  - und/oder direkt als CSS-Variablen am Layout-Wrapper (`--primary`, `--ring`)

Damit hat der erste sichtbare Paint bereits die richtige Branding-Farbe.

## 2. Loader neutral machen
### `src/components/ProtectedRoute.tsx`
Aktuell nutzt der Spinner `border-primary` und ist deshalb zuerst blau.

Geplante Anpassung:
- Für den Auth-/Role-Loader eine neutrale Farbe verwenden, z. B. Grau/Foreground mit Opacity
- Kein `primary`, solange Branding noch nicht bekannt ist

Damit sieht der Mitarbeiter nie mehr die blaue Standardfarbe vor dem Branding.

## 3. Sidebar/Logo erst nach vollständigem Ready rendern
### `src/components/mitarbeiter/MitarbeiterSidebar.tsx`
Die Sidebar soll nicht mehr „halb geladen“ erscheinen.

Geplante Wirkung:
- Kein Skeleton mehr sichtbar beim initialen Panel-Start
- Kein kurzes Aufblitzen des Arbeitsvertrag-Menüpunkts
- Kein leeres oder verspätet erscheinendes Logo

Die Sidebar wird einfach erst dann gemountet, wenn `panelReady === true`.

## Technische Details
Root Cause:
```text
fetchData -> setBranding(...)
         -> setLoading(false)
         -> React rendert Panel
         -> useEffect setzt erst danach --primary
         -> Browser zeigt einen Frame mit Default-Blau
```

Neue Reihenfolge:
```text
fetchData
-> Branding laden
-> brand_color in HSL umrechnen
-> Logo preloaden
-> Branding-CSS vor Paint vorbereiten
-> panelReady = true
-> Erst jetzt Mitarbeiter-Panel rendern
```

## Zusatz: aktueller Build-Blocker
Beim Umsetzen sollte auch der bestehende Build-Fehler mit TipTap bereinigt werden:
- `package.json` enthält die TipTap-Dependencies bereits
- `package-lock.json` scheint aber noch nicht synchron zu sein

Deshalb im gleichen Schritt:
- Lockfile sauber synchronisieren, damit die TS2307-Fehler für
  - `@tiptap/react`
  - `@tiptap/starter-kit`
  - `@tiptap/extension-underline`
  verschwinden

## Ergebnis
Nach der Umsetzung:
- kein blaues Default-Branding mehr beim Login
- kein kurzes Aufblitzen vom Arbeitsvertrag-Menüpunkt
- kein verspätet ladendes Branding-Logo
- stattdessen erst neutraler Spinner, dann sofort das vollständig gebrandete Mitarbeiter-Panel
