

# Fix: Daten-Flicker beim Seitenwechsel im Admin-Panel

## Problem
Beim Wechsel zwischen Reitern im Admin-Panel werden kurzzeitig falsche/alle Daten angezeigt, bevor die korrekten (durch RLS gefilterten) Daten erscheinen. Ursachen:

1. **Query-Cache nicht user-spezifisch**: Alle Query-Keys (z.B. `["applications"]`, `["orders"]`) enthalten keine User-ID. Wenn ein anderer User sich einloggt, werden kurz die gecachten Daten des vorherigen Users angezeigt.
2. **Cache wird bei Auth-Wechsel nicht geleert**: Beim Login/Logout wird der React-Query-Cache nicht zurückgesetzt.

## Lösung

### 1. Query-Cache bei Auth-Wechsel leeren
In `AuthContext.tsx` den QueryClient importieren und bei jedem Auth-State-Change (`SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`) den Cache komplett leeren mit `queryClient.clear()`. Alternativ in `App.tsx` einen Effect einbauen, der auf User-Wechsel reagiert.

**Konkret**: Einen neuen Hook/Effect in `App.tsx` erstellen, der `useAuth()` nutzt und bei User-ID-Wechsel `queryClient.clear()` aufruft.

### 2. User-ID in alle Admin-Query-Keys aufnehmen
Einen kleinen Helper-Hook `useUserQueryKey` erstellen, der die aktuelle User-ID liefert. Alle Admin-Page-Queries bekommen die User-ID als Teil des Query-Keys:
```
["applications", userId]  statt  ["applications"]
```

So wird bei unterschiedlichen Usern automatisch neu gefetcht statt gecachte Daten zu zeigen.

### 3. Keine stale Daten anzeigen bei fehlendem User
Queries auf Admin-Seiten sollen `enabled: !!userId` nutzen, damit sie erst feuern wenn der User authentifiziert ist.

## Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `src/App.tsx` | Effect für Cache-Clear bei User-Wechsel |
| `src/hooks/useUserQueryKey.ts` | Neuer Hook (gibt `[userId]` zurück) |
| Alle `src/pages/admin/*.tsx` (17 Dateien) | Query-Keys um userId erweitern, `enabled: !!userId` |
| `src/components/admin/UpcomingStartDates.tsx` | Query-Key um userId erweitern |
| `src/pages/admin/AdminSmsHistory.tsx` | Query-Key um userId erweitern |

## Ergebnis
- Kein Flicker mehr beim Seitenwechsel
- Kein kurzes Anzeigen fremder Daten nach Login-Wechsel
- Daten werden erst geladen wenn der User authentifiziert ist

