

# Admin-Panel Popups optimieren: Blur entfernen + individuelles Styling

## Problem
1. `backdrop-blur-sm` auf Dialog- und AlertDialog-Overlays verursacht Lag beim Öffnen
2. Buttons in Popups sind "langweilig" (Standard-Styling ohne visuelle Hierarchie)
3. Popups sehen generisch aus, kein Premium-Look

## Betroffene Dateien (einzeln bearbeitet)

### 1. `src/components/ui/dialog.tsx` — Overlay-Fix (Performance)
- **Entferne `backdrop-blur-sm`** aus DialogOverlay
- Behalte `bg-black/60` als Overlay-Hintergrund (dimmt ohne GPU-Last)

### 2. `src/components/ui/alert-dialog.tsx` — Overlay-Fix (Performance)
- Gleiche Änderung: `backdrop-blur-sm` entfernen aus AlertDialogOverlay
- AlertDialogAction: Modernerer Button-Style mit `font-medium`
- AlertDialogCancel: Subtilerer Ghost-Style

### 3. `src/components/admin/MitarbeiterDetailPopup.tsx` — Premium-Popup
- Buttons in der Auftrags-Tabelle modernisieren: "Freischalten"-Button mit grünem Gradient und Hover-Scale
- Cards innerhalb des Popups: Subtilere Borders, leichter Shadow

### 4. `src/components/admin/AssignmentDialog.tsx` — Zuweisungs-Dialog
- Speichern-Button: Primary mit `shadow-sm` und `hover:shadow-md` Transition
- Abbrechen-Button: Ghost statt Outline für cleaneren Look
- Checkbox-Labels: Hover-State verbessern mit leichtem Scale-Effekt

### 5. `src/pages/admin/AdminArbeitsvertraege.tsx` — Vertragsdetails-Popup
- "Genehmigen"-Button: Moderner mit `shadow-sm`, `hover:shadow-md`, leichtem Scale
- "Daten kopieren"-Button: Icon-Button-Style modernisieren
- "Schließen"-Button: Ghost statt Outline
- Startdatum-Dialog: Calendar-Container mit Border und Rounded-Corners aufwerten

### 6. `src/pages/admin/AdminAuftraege.tsx` — Auftrags-Dialog
- Footer-Buttons: Speichern mit Shadow-Effekt, Abbrechen als Ghost
- Input-Labels: Leicht farbige Akzente

### 7. `src/pages/admin/AdminBewerbungen.tsx` — Bewerbungs-Dialoge
- "Bewerbung hinzufügen"-Dialog: Submit-Button modernisieren
- Detail-Dialog: Felder-Layout mit subtileren Trennlinien

### 8. `src/pages/admin/AdminBewerbungsgespraeche.tsx` — Erinnerungs-Dialog
- "Senden"-Button: Primary mit Shadow
- SMS-Vorschau-Box: Modernerer Border-Style

### 9. `src/pages/admin/AdminBrandings.tsx` — Branding-Dialog
- Submit-Button: Shadow + Hover-Effekt
- Sektions-Trenner: Modernerer Divider-Style

### 10. `src/pages/admin/AdminMitarbeiter.tsx` — Sperr-AlertDialog
- "Sperren"-Button: Destructive mit Shadow
- "Entsperren"-Button: Green mit Shadow

### 11. `src/pages/admin/AdminLivechat.tsx` — Chat-Dialoge
- Auftrags-Auswahl-Buttons: Hover-Scale + modernerer Border
- SMS-Senden-Button: Shadow-Effekt

### 12. `src/pages/admin/AdminSmsSpoof.tsx` — SMS-Dialoge
- Template-Dialoge: Buttons modernisieren
- Bestätigungs-Dialog: Senden-Button mit Icon + Shadow
- Mitarbeiter-Auswahl: Hover-States verbessern

### 13. `src/pages/admin/AdminBewertungen.tsx` — Bewertungs-Dialog
- Genehmigen/Ablehnen-Buttons: Modernere Icon-Buttons mit Shadow

### 14. `src/pages/admin/AdminKunden.tsx` — Kunden-Dialog
- "Konto erstellen"-Button: Shadow + Hover-Scale
- Dialog-Layout aufräumen

### 15. `src/pages/admin/AdminTelefonnummern.tsx` — Lösch-AlertDialoge
- "Löschen"-Button: Destructive mit Shadow-Effekt

## Button-Styling-Konzept (durchgängig)
- **Primary Actions**: `shadow-sm hover:shadow-md transition-all` + leichter Hover-Scale über CSS
- **Destructive Actions**: `shadow-sm` mit `hover:shadow-md`
- **Cancel/Close**: `variant="ghost"` statt `variant="outline"` wo möglich
- **Icon-Buttons**: Runde Hintergrund-Highlights bei Hover

## Ergebnis
- Kein Lag mehr beim Öffnen (kein Blur)
- Konsistente, moderne Button-Hierarchie in allen Popups
- Jedes Popup individuell optimiert

