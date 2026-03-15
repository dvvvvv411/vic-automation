

# Scrollbar: Blau & immer sichtbar

## Änderungen

### `src/components/ui/scroll-area.tsx`
- Thumb-Farbe von `bg-border` auf `bg-primary/40` ändern (blau)
- `data-state` unabhängig immer sichtbar machen: `forceMount` Prop auf dem ScrollAreaScrollbar setzen oder die Opacity-Animation per CSS überschreiben

Radix ScrollArea blendet die Scrollbar automatisch aus. Um sie immer sichtbar zu halten, muss `forceMount` auf dem `ScrollAreaScrollbar` gesetzt werden. Zusätzlich muss die CSS-Animation/Opacity überschrieben werden mit `!opacity-100`.

### Konkrete Änderungen (Zeile 22-34)
```tsx
<ScrollAreaPrimitive.ScrollAreaScrollbar
  ref={ref}
  orientation={orientation}
  forceMount
  className={cn(
    "flex touch-none select-none transition-colors !opacity-100",
    orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
    orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
    className,
  )}
  {...props}
>
  <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-primary/40 hover:bg-primary/60 transition-colors" />
</ScrollAreaPrimitive.ScrollAreaScrollbar>
```

### Betroffene Datei
- `src/components/ui/scroll-area.tsx`

**Hinweis**: Dies gilt global für alle ScrollArea-Nutzungen im Projekt (Sidebar, Dialoge etc.), was zum bestehenden blauen Scrollbar-Design passt.

