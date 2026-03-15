

# Fix: Mitarbeiter-Liste Scrollbar im Zuweisungs-Popup

## Problem
`ScrollArea` mit `max-h-[340px]` funktioniert nicht korrekt, da Radix ScrollArea eine feste Höhe (`h-[...]`) auf dem Root-Element braucht, nicht `max-h`.

## Lösung
Die Mitarbeiterliste in eine Card (border + rounded container) wrappen und der ScrollArea eine feste Höhe geben:

### Änderungen in `AssignmentDialog.tsx` (Zeilen 245-282)
- Die Liste in einen `rounded-lg border` Container wrappen (Card-Look)
- `ScrollArea` bekommt `h-[340px]` statt `max-h-[340px]`
- Innerer Container bekommt `p-2` Padding für den Card-Look
- Wenn weniger als 5 Einträge: kein fester Height-Constraint nötig, also dynamisch mit `className={filteredItems.length > 5 ? "h-[340px]" : ""}` 

```tsx
<div className="rounded-lg border mt-2">
  <ScrollArea className={filteredItems.length > 5 ? "h-[340px]" : ""}>
    <div className="space-y-2 p-2">
      {/* items */}
    </div>
  </ScrollArea>
</div>
```

### Betroffene Datei
- `src/components/admin/AssignmentDialog.tsx`

