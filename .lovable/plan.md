

# Fix: Mitarbeiter Sidebar soll hell sein

## Problem
Die CSS-Variablen `--sidebar-background`, `--sidebar-foreground` etc. in `index.css` sind global auf dunkle Farben gesetzt. Das AdminPanel nutzt diese korrekt, aber die MitarbeiterSidebar erbt sie ebenfalls und wird dadurch dunkel.

## Lösung

**File: `src/components/mitarbeiter/MitarbeiterLayout.tsx`**

Den `<div>` Wrapper um die MitarbeiterSidebar mit CSS-Variablen-Overrides versehen, die helle Sidebar-Werte setzen. So bleibt die Admin-Sidebar dunkel und die Mitarbeiter-Sidebar wird hell.

Inline-Style auf dem äußeren Layout-`div` (innerhalb von `SidebarProvider`):

```typescript
style={{
  '--sidebar-background': '0 0% 100%',        // white
  '--sidebar-foreground': '220 20% 14%',       // dark text
  '--sidebar-primary': '217 91% 60%',          // keep blue
  '--sidebar-primary-foreground': '0 0% 100%',
  '--sidebar-accent': '220 14% 96%',           // light gray
  '--sidebar-accent-foreground': '220 20% 14%',
  '--sidebar-border': '220 13% 91%',           // light border
  '--sidebar-ring': '217 91% 60%',
  '--sidebar-muted': '220 14% 96%',
} as React.CSSProperties}
```

Dies überschreibt die dunklen Sidebar-Variablen nur im Scope des Mitarbeiter-Layouts, ohne die globalen Werte oder das Admin-Panel zu beeinflussen.

