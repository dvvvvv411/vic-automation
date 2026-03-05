

# SMS Spoof Page Redesign

## Layout Changes

### 1. Merge "Nachricht senden" + "Verlauf" into one 50/50 split section
Replace the two separate cards with a single card containing a two-column grid layout:
- **Left column**: The existing manual send form (phone input, HLR lookup, sender name, message, send button)
- **Right column**: The history table with log preview button

On mobile, the columns stack vertically.

### 2. Redesign Templates section
Replace the inline "Template erstellen" form card + separate "Gespeicherte Templates" grid with a single section:
- A horizontal row of template cards (max 5 per row including the "+" card)
- The **first card** (or last, depending on template count) is always a "+" card -- a dashed-border card with a Plus icon. Clicking it opens a **Dialog** with the template creation form (label, sender name, message, variable info)
- Existing templates show as cards with label, sender preview, and action buttons (send, delete)
- Grid uses `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` to enforce max 5 per row

### 3. Visual polish
- Add subtle gradient or icon accent to the page header
- Use `Separator` between sections
- Template cards get a hover effect and cleaner typography

## File Changes

**`src/pages/admin/AdminSmsSpoof.tsx`** -- Full restructure of the JSX:
1. New state: `showCreateDialog` boolean for template creation dialog
2. Page header with description text
3. **Templates section**: grid of template cards + "+" card, create dialog
4. **Separator**
5. **Send & History section**: single Card with `grid grid-cols-1 lg:grid-cols-2` split
   - Left: send form (existing logic unchanged)
   - Right: history table (existing logic unchanged)
6. Dialogs remain unchanged (employee selection, confirmation, log preview)

No backend or database changes needed.

