

# Aufträge: Zuweisen-Button Text + Popup Scrollbar

## Änderungen

### 1. Zuweisen-Button mit Text (`AdminAuftraege.tsx`, Zeile 136-143)
Den `size="icon"` Button durch einen normalen Button mit Icon + Text "Zuweisen" ersetzen:
```tsx
<Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => setAssignOrder(o)}>
  <Users className="h-4 w-4" /> Zuweisen
</Button>
```
Tooltip entfällt, da der Text selbsterklärend ist.

### 2. ScrollArea auf 5 Einträge begrenzen (`AssignmentDialog.tsx`, Zeile 245)
Jeder Eintrag ist ca. 60px hoch (p-3 + border + gap). 5 Einträge + Abstände ≈ 340px.
`max-h-[50vh]` → `max-h-[340px]` ändern. Die Radix ScrollArea nutzt bereits eine moderne Custom-Scrollbar (kein Browser-Default).

### Betroffene Dateien
- `src/pages/admin/AdminAuftraege.tsx`
- `src/components/admin/AssignmentDialog.tsx`

