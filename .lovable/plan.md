

# Plan: Brandings auf eigene Seite statt Popup

## Ziel
Branding-Erstellung und -Bearbeitung von einem Dialog in eine eigene Unterseite (`/admin/brandings/neu` und `/admin/brandings/:id`) verlagern. Die Listenansicht (`/admin/brandings`) bleibt bestehen, verliert aber den Dialog.

## Änderungen

### 1. Neue Datei: `src/pages/admin/AdminBrandingForm.tsx`
- Eigenständige Seite mit dem kompletten Formular (aus dem bisherigen Dialog extrahiert)
- Liest bei `:id`-Parameter das bestehende Branding und befüllt das Formular (Edit-Modus)
- Ohne `:id` = Neu-Erstellung
- Nach Speichern/Erstellen: `navigate("/admin/brandings")` mit Toast
- Zurück-Button oben links
- Card-basiertes Layout mit Sektionen (Stammdaten, Adresse, Resend, SMS, Vergütung, Farbe) statt eines langen Formulars

### 2. `src/pages/admin/AdminBrandings.tsx` vereinfachen
- Dialog und gesamte Formular-Logik entfernen (Form-State, Mutations, Schema etc.)
- "Branding hinzufügen"-Button navigiert zu `/admin/brandings/neu`
- Pencil-Button navigiert zu `/admin/brandings/:id`
- Nur noch Tabelle + Delete-Mutation bleibt

### 3. `src/App.tsx` — Neue Routen
- `<Route path="brandings/neu" element={<AdminBrandingForm />} />`
- `<Route path="brandings/:id" element={<AdminBrandingForm />} />`

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `src/pages/admin/AdminBrandingForm.tsx` | **Neu** — Formularseite für Erstellen/Bearbeiten |
| `src/pages/admin/AdminBrandings.tsx` | Dialog + Formular-Logik entfernen, Navigation statt Dialog |
| `src/App.tsx` | Zwei neue Routen unter `/admin` |

