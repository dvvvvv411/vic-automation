

# Fix: "Anhänge einreichen" Button-Styling seriöser machen

## Problem
Der Button nutzt einen auffälligen Amber-Gradient (`bg-gradient-to-r from-amber-500 to-amber-400`), der unseriös wirkt.

## Lösung
Den Button auf `variant="outline"` umstellen mit einer dezenten Amber-Akzentfarbe — konsistent mit den anderen Status-Buttons (z.B. "In Überprüfung", "Erneut bewerten"):

```tsx
<Button
  className="w-full mt-2 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50"
  size="sm"
  variant="outline"
  onClick={...}
>
```

## Betroffene Dateien
| Datei | Zeile |
|-------|-------|
| `MitarbeiterAuftraege.tsx` | 66 |
| `MitarbeiterDashboard.tsx` | 52 |

