

# Flash-of-unstyled-content beim Mitarbeiter-Panel verhindern

## Problem
Beim Laden von `/mitarbeiter` werden kurzzeitig sichtbar:
1. Der "Arbeitsvertrag"-Eintrag in der Sidebar (verschwindet erst nach Daten-Load)
2. Die blaue Standard-Primärfarbe (bevor die Branding-Farbe gesetzt wird)
3. Ein Skeleton/leeres Logo (bevor das Branding-Logo geladen ist)

Ursache: Das Layout wird sofort gerendert während `loading === true`, und die Sidebar zeigt alle Nav-Items an, weil `contractStatus` noch `undefined` ist.

## Lösung

### `src/components/mitarbeiter/MitarbeiterLayout.tsx`
- **Ladebildschirm hinzufügen**: Solange `loading === true`, einen Fullscreen-Spinner anzeigen (wie beim Admin-Layout) anstatt das gesamte Layout mit Sidebar zu rendern. Erst wenn Branding + Contract geladen sind, wird das Layout gerendert.
- Dadurch wird die Branding-Farbe gesetzt bevor der User die UI sieht, das Logo ist sofort korrekt, und der Arbeitsvertrag-Tab wird korrekt gefiltert.

```tsx
if (loading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
```

Dies wird **vor** dem `return <SidebarProvider>` eingefügt (nach dem `is_suspended`-Check, ca. Zeile 132).

### Resultat
- Kein Flash von "Arbeitsvertrag" in der Sidebar
- Kein Flash der blauen Standardfarbe
- Kein leeres Logo — alles wird erst angezeigt wenn komplett geladen

