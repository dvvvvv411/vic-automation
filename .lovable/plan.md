

# Starter-Job Badge in Auftragsliste

## Problem
Starter-Jobs werden nur mit einem kleinen Stern-Icon neben dem Titel angezeigt — leicht zu übersehen.

## Lösung
Den Stern durch ein deutliches Badge ersetzen (wie die anderen Badges für Typ und Vergütung), z.B.:
```
⭐ Starter-Job
```

## Änderung in `src/pages/admin/AdminAuftraege.tsx`

Zeile 101-103: Das `Star`-Icon durch ein sichtbares Badge ersetzen:

```tsx
{o.is_starter_job && (
  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 text-xs">
    <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
    Starter-Job
  </Badge>
)}
```

Das Badge wird in die bestehende Badge-Reihe (Zeile 106-113) verschoben, neben Vergütung und Typ.

