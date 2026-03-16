

# Signature Dialog Cleanup

## Problem
The signature dialog has 3 buttons (Löschen, Abbrechen, Unterschreiben & Einreichen) that look cluttered and inconsistent in size. "Abbrechen" is redundant with the X close button.

## Changes

**File**: `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx` (lines 1055-1061)

Replace the DialogFooter with:
- A `flex justify-between items-center` layout
- Left side: Trash2 icon button (ghost variant, icon-only) to clear the canvas
- Right side: Single primary button with shorter text "Bestätigen"
- Remove the "Abbrechen" button entirely

```jsx
<DialogFooter className="flex flex-row justify-between items-center sm:justify-between">
  <Button variant="ghost" size="icon" onClick={clearCanvas} className="text-muted-foreground">
    <Trash2 className="h-4 w-4" />
  </Button>
  <Button onClick={handleSign} disabled={submitting}>
    {submitting ? "Wird eingereicht..." : "Bestätigen"}
  </Button>
</DialogFooter>
```

Ensure `Trash2` is imported from lucide-react (likely already is from ContractSigningView, but verify in this file's imports).

