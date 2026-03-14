

# Admin-Panel Popups optisch modernisieren

## Ansatz
Statt jede einzelne Admin-Seite anzufassen, werden die **shared UI-Komponenten** (`dialog.tsx`, `alert-dialog.tsx`) und ein globaler CSS-Block modernisiert. Das betrifft automatisch alle ~20+ Dialoge im Admin-Panel.

## Änderungen

### 1. `src/components/ui/dialog.tsx` — DialogContent
- Entferne den Standard-Border, setze `border-0 shadow-2xl rounded-2xl`
- Backdrop: `bg-black/60 backdrop-blur-sm` statt `bg-black/80`
- Close-Button: Runder Hintergrund (`rounded-full bg-muted/80 hover:bg-muted p-1`)

### 2. `src/components/ui/alert-dialog.tsx` — AlertDialogContent + Overlay
- Gleiche Anpassungen wie Dialog: `border-0 shadow-2xl rounded-2xl`
- Overlay: `bg-black/60 backdrop-blur-sm`
- AlertDialogAction (destructive): `bg-destructive hover:bg-destructive/90` als Default-Styling
- AlertDialogCancel: Subtilerer Outline-Look

### 3. `src/index.css` — Globales Dialog-Styling
- Custom Scrollbar innerhalb von Dialogen (analog zur Admin-Sidebar-Scrollbar, in Blau)
- Smooth entrance-Animation verfeinern

### 4. `src/components/admin/MitarbeiterDetailPopup.tsx`
- Gradient-Leiste oben im Dialog-Header (analog zu den Admin-Cards)
- Header-Bereich mit leichtem Hintergrund-Gradient

### 5. `src/components/admin/AssignmentDialog.tsx`
- Gradient-Leiste oben, modernere Suchleiste mit Icon innerhalb des Inputs

## Ergebnis
Alle Dialoge im Admin-Panel bekommen automatisch: abgerundete Ecken, weicheren Schatten, Blur-Backdrop, moderne Scrollbar und einen cleanen Close-Button — ohne jede einzelne Seite anfassen zu müssen.

