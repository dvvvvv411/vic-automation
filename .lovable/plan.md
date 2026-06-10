## Ziel
`/karriere` soll nicht mehr per `window.location.replace` auf `https://for-tel.solutions/karriere/onlineprozess-tests` weiterleiten, sondern die Zielseite direkt eingebettet auf der eigenen `/karriere`-Route anzeigen.

## Umsetzung
- `src/pages/KarriereRedirect.tsx` umbauen:
  - Redirect-`useEffect` entfernen.
  - Fullscreen-`<iframe src={TARGET}>` rendern (100vw × 100vh, kein Border).
  - `title="Karriere"` für Accessibility.
  - Optional dezentes Loading-Overlay bis `onLoad`.
- Datei ggf. in `Karriere.tsx` umbenennen wäre sauberer, aber nicht zwingend — Import in `src/App.tsx` bleibt sonst unverändert. Vorschlag: nur Inhalt der Datei ersetzen, Name bleibt (kein Routing-Refactor nötig).

## Wichtiger Hinweis
Ob die Einbettung tatsächlich funktioniert, hängt vom Zielserver ab: Wenn `for-tel.solutions` `X-Frame-Options: DENY/SAMEORIGIN` oder eine `Content-Security-Policy: frame-ancestors`-Restriktion sendet, blockiert der Browser den iframe und es bleibt eine weiße Fläche. In dem Fall müsste man entweder
- die Restriktion auf der Zieldomain lockern, oder
- den Inhalt server-seitig (Edge Function als Proxy) holen — was rechtlich/SEO-mäßig heikel ist und URLs/Assets rewriten müsste.

Ich baue zunächst die einfache iframe-Variante. Falls leer → Rückmeldung an den User.
