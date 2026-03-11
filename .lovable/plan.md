

# Fix: SMS Spoof Seite für Kunden nicht erreichbar

## Problem
`KUNDE_BLOCKED_PATHS` enthält `/admin/sms`. Der Check `location.pathname.startsWith("/admin/sms")` trifft auch auf `/admin/sms-spoof` zu, da der Pfad mit `/admin/sms` beginnt.

## Lösung
In beiden Dateien (`AdminLayout.tsx` und `AdminSidebar.tsx`) den `startsWith`-Check durch einen exakten Vergleich ersetzen, da alle Blocked-Paths vollständige Pfade sind:

| Datei | Änderung |
|-------|----------|
| `AdminLayout.tsx` (Zeile 29) | `startsWith(p)` → exakter Match `pathname === p` oder `startsWith(p + "/")` |
| `AdminSidebar.tsx` (Zeile 178) | Gleicher Fix bei `KUNDE_HIDDEN_PATHS.includes(item.url)` — hier ist es bereits `includes` (exakt), also kein Problem |

Konkret nur `AdminLayout.tsx` Zeile 29 ändern:
```ts
if (isKunde && KUNDE_BLOCKED_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + "/")))
```

Dies erlaubt `/admin/sms-spoof` während `/admin/sms` und `/admin/sms/...` weiterhin blockiert bleiben.

