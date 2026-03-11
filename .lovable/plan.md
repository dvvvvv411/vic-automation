

# Fix: Sidebar hat transparenten Hintergrund

## Problem
Die Sidebar nutzt `bg-sidebar` (= `hsl(var(--sidebar-background))`), aber die CSS-Variable `--sidebar-background` ist in `index.css` nie definiert. Dadurch ist der Hintergrund transparent und Tabelleninhalte scheinen durch.

## Lösung
In `src/index.css` unter `:root` alle fehlenden Sidebar-CSS-Variablen ergänzen:

```css
--sidebar-background: 0 0% 100%;        /* weiß */
--sidebar-foreground: 220 20% 14%;       /* gleich wie --foreground */
--sidebar-primary: 217 91% 60%;          /* gleich wie --primary */
--sidebar-primary-foreground: 0 0% 100%;
--sidebar-accent: 220 14% 96%;           /* gleich wie --accent */
--sidebar-accent-foreground: 220 20% 14%;
--sidebar-border: 220 13% 91%;           /* gleich wie --border */
--sidebar-ring: 217 91% 60%;             /* gleich wie --ring */
```

## Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `src/index.css` | 8 CSS-Variablen unter `:root` hinzufügen |

