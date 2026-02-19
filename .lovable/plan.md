

# Logo auf der Auth-Seite normal anzeigen

## Problem

Auf der `/auth`-Seite wird das Branding-Logo im linken Panel durch den CSS-Filter `brightness-0 invert` komplett weiß eingefärbt. Das soll entfernt werden, damit das Logo in seinen Originalfarben angezeigt wird.

## Änderung

### `src/pages/Auth.tsx`

In Zeile 97 den CSS-Filter `brightness-0 invert` entfernen:

```
// Vorher:
className="max-h-16 w-auto object-contain brightness-0 invert"

// Nachher:
className="max-h-16 w-auto object-contain"
```

| Datei | Änderung |
|-------|----------|
| `src/pages/Auth.tsx` | `brightness-0 invert` aus Logo-Klasse entfernen |

