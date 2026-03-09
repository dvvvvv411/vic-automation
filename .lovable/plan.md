

# Auth-Seite: Subdomain-Erkennung für Branding

## Problem
Die Auth-Seite wird über `web.DOMAIN.de` aufgerufen. Der aktuelle Code strippt Subdomains korrekt (`parts.slice(-2).join(".")`), sodass `web.example.de` → `example.de` wird. Das funktioniert bereits richtig.

**Aber**: Es wird nur `logo_url` gefetcht, nicht `brand_color`. Der vorherige Plan zur Brand-Color-Integration wurde noch nicht umgesetzt.

## Änderungen in `src/pages/Auth.tsx`

1. **Select erweitern**: `logo_url` → `logo_url, brand_color` (beide Queries: Domain-Match + Fallback)
2. **State erweitern**: `brandingColor: string | null` hinzufügen
3. **useEffect für CSS-Variable**: `--primary` dynamisch setzen wenn `brandingColor` vorhanden
4. **Linkes Panel**: Festen blauen Gradient durch `hsl(var(--primary))` basierten Gradient ersetzen

## Neue Datei: `src/lib/hexToHSL.ts`
- `hexToHSL`-Funktion aus `MitarbeiterLayout.tsx` extrahieren
- Import in `Auth.tsx` und `MitarbeiterLayout.tsx`

## Subdomain-Logik
Der bestehende Code in Zeile 35-38 funktioniert bereits korrekt: `web.example.de` → `example.de`. Keine Änderung nötig.

