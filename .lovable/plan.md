

# Fix: Transparente Mobile-Sidebar

## Problem

Die `bg-white`-Klasse, die in `MitarbeiterSidebar.tsx` auf die `<Sidebar>`-Komponente gesetzt wird, kommt auf Mobile nie an. Der Grund: In `sidebar.tsx` (Zeile 153-170) wird bei Mobile ein `<Sheet>` gerendert, und die `className`-Prop wird auf `<Sheet>` statt auf `<SheetContent>` angewendet. Das `SheetContent` hat fest `bg-sidebar` gesetzt, was die CSS-Variable `--sidebar-background` nutzt -- und die ist durchsichtig/dunkel.

## Loesung

In `src/components/ui/sidebar.tsx` wird die `className`-Prop im Mobile-Fall an das `SheetContent` weitergeleitet (statt an `Sheet`), damit `bg-white` aus der `MitarbeiterSidebar` das `bg-sidebar` ueberschreiben kann.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/components/ui/sidebar.tsx` | Im Mobile-Block (Zeile 153-170): `className` von den `...props` trennen und stattdessen an `SheetContent` uebergeben, sodass `bg-white` dort greift. Konkret wird `className` in die `cn()`-Funktion des `SheetContent` eingefuegt, nach `bg-sidebar`, damit es dieses ueberschreibt. |

## Technisches Detail

Vorher (vereinfacht):
```text
<Sheet {...props}>          <-- className landet hier (unsichtbar)
  <SheetContent className="bg-sidebar ...">  <-- immer bg-sidebar
```

Nachher:
```text
<Sheet {...restProps}>      <-- className entfernt
  <SheetContent className={cn("bg-sidebar ...", className)}>  <-- bg-white ueberschreibt
```

