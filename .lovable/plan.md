

## Plan: Zeitplan-Seite auf Tabs umstellen und Branding-Dropdowns entfernen

### Aktueller Zustand
Die Seite `/admin/zeitplan` zeigt 3 Sektionen untereinander (Zeiteinstellungen, Bewerbungsgespräch blockieren, Probetag blockieren). Beide Blocker haben Branding-Dropdowns, und die Zeiteinstellungen zeigen Tabs pro Branding -- alles überflüssig, da das aktive Branding bereits in der Sidebar gewählt wird.

### Änderungen

**`src/pages/admin/AdminZeitplan.tsx`**
- Die 3 Sektionen in 3 Top-Level-Tabs umwandeln: "Zeiteinstellungen", "Gespräch blockieren", "Probetag blockieren"
- Zeiteinstellungen: Branding-Tabs entfernen, direkt das Formular für `activeBrandingId` anzeigen
- Bewerbungsgespräch blockieren: Branding-Dropdown entfernen, `activeBrandingId` direkt beim Insert verwenden
- Blocked-Slots-Query auf `activeBrandingId` filtern (`.eq("branding_id", activeBrandingId)`)
- Brandings-Query komplett entfernen (nicht mehr benötigt)

**`src/components/admin/TrialDayBlocker.tsx`**
- Neues Prop `brandingId: string` hinzufügen
- Brandings-Query und Dropdown entfernen
- `brandingId` direkt beim Insert verwenden statt `blockBrandingId`
- Blocked-Slots-Query auf `brandingId` filtern

**Aufrufer:** `AdminZeitplan` übergibt `activeBrandingId` an `TrialDayBlocker`.

### Ergebnis
- 3 übersichtliche Tabs statt 3 lange Sektionen
- Keine redundanten Branding-Dropdowns mehr
- Blockierungen gelten automatisch für das in der Sidebar gewählte Branding

