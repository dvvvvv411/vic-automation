
Ziel: `/mitarbeiter` darf erst sichtbar werden, wenn Vertragsstatus, Branding-Farbe und Logo vollständig bereit sind. Bis dahin nur ein neutraler Fullscreen-Loader. Zusätzlich muss der aktuelle Build-Blocker mit TipTap behoben werden.

## Was ich gefunden habe
- `src/components/mitarbeiter/MitarbeiterLayout.tsx` hat bereits `panelReady`, aber das Branding wird trotzdem noch global über `document.documentElement` gesetzt. Das ist anfällig für Timing-Rennen.
- `src/pages/Auth.tsx` setzt ebenfalls `--primary` global und entfernt es beim Unmount wieder. Genau beim Wechsel von `/auth` nach `/mitarbeiter` kann dadurch kurz die Standard-Blaufarbe zurückfallen.
- In `MitarbeiterLayout` sind `--sidebar-primary` und `--sidebar-ring` aktuell fest auf Blau gesetzt.
- `MitarbeiterSidebar` zeigt den Arbeitsvertrag-Tab standardmäßig, solange `contractStatus` noch `undefined` ist.
- Die TipTap-Buildfehler kommen sehr wahrscheinlich daher, dass `package.json` die Pakete enthält, `package-lock.json` aber nicht. Das Projekt ist laut `README.md` npm-basiert.

## Umsetzungsplan

### 1. Mitarbeiter-Panel erst nach vollständigem Branding rendern
Datei: `src/components/mitarbeiter/MitarbeiterLayout.tsx`

Ich würde den Layout-Flow so umbauen:
- Contract + Branding laden
- Branding-Farbe sofort in HSL umrechnen und in State halten
- Logo vorab preloaden
- Erst dann `panelReady = true`
- Vorher ausschließlich neutralen Fullscreen-Spinner rendern

Wichtig:
- Nicht erst nachträglich per spätem Effekt das sichtbare Panel umfärben
- Die finalen CSS-Variablen direkt am sichtbaren Layout-Wrapper setzen, damit der erste sichtbare Render schon korrekt gebrandet ist
- Auch `--sidebar-primary` / `--sidebar-ring` aus dem Branding ableiten oder neutral halten, nicht hart auf Blau

### 2. Race zwischen Auth-Seite und Mitarbeiter-Branding entfernen
Datei: `src/pages/Auth.tsx`

Die Auth-Seite sollte die globale `--primary`-Variable nicht mehr so bereinigen, dass beim Route-Wechsel ein kurzer Rückfall auf Default-Blau möglich ist.

Sauberer Ansatz:
- Auth-Branding auf die Auth-Seite selbst scopen statt auf `document.documentElement`
- oder das globale Entfernen so umbauen, dass es dem nachfolgenden Mitarbeiter-Layout nicht dazwischenfunkt

Damit verschwindet der typische „ein Frame blau, dann Brandingfarbe“-Effekt.

### 3. Arbeitsvertrag-Tab niemals im undefinierten Zustand anzeigen
Datei: `src/components/mitarbeiter/MitarbeiterSidebar.tsx`

Ich würde die Logik robuster machen:
- nicht mehr „anzeigen solange Status noch unbekannt ist“
- stattdessen eine explizite Boolean-Info aus dem Layout übergeben, z. B. `showContractLink`
- diese wird erst gesetzt, wenn der Contract wirklich geladen wurde

Ergebnis:
- kein kurzes Aufblitzen von „Arbeitsvertrag“
- keine Sidebar-Skeleton/Teilzustände beim ersten Paint

### 4. TipTap-Buildfehler beheben
Datei: `package-lock.json` (und nur falls nötig ergänzend `package.json` prüfen)

Die drei Fehler stammen sehr wahrscheinlich daher, dass:
- `package.json` TipTap enthält
- `bun.lock` TipTap enthält
- `package-lock.json` TipTap nicht enthält

Ich würde deshalb das npm-Lockfile mit den bestehenden Dependencies synchronisieren, damit diese Imports wieder aufgelöst werden:
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-underline`

## Technische Wirkung nach der Umsetzung
```text
Vorher:
Route wechselt -> globale Primary wird entfernt/ist default blau
-> Shell oder Teile davon werden sichtbar
-> Branding kommt erst danach

Nachher:
Route wechselt -> nur neutraler Loader sichtbar
-> Contract + Branding + Logo vollständig geladen
-> CSS-Variablen stehen bereits fest
-> erster sichtbarer Panel-Render ist sofort komplett in Brandingfarbe
```

## Ergebnis
Nach der Umsetzung sollte der Mitarbeiter nur noch Folgendes sehen:
- zuerst einen neutralen Ladebildschirm
- danach direkt das vollständig gebrandete Panel

Also:
- kein blaues Aufblitzen
- kein verspätetes Logo
- kein kurzes Anzeigen von „Arbeitsvertrag“
- zusätzlich wieder sauberer Build ohne TipTap-Fehler
