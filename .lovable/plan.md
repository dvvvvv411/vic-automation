

# Erforderliche Anhänge UI-Verbesserung

## Änderungen in `AuftragDetails.tsx`

### 1. Grid-Layout statt vertikal
Attachment-Cards nebeneinander als quadratische Cards in einem responsive Grid (`grid-cols-2 md:grid-cols-3`).

### 2. Abstand zwischen Beschreibung und Upload-Button
`mt-4` oder `space-y-4` zwischen dem Beschreibungstext und dem Datei-Upload-Bereich.

### 3. "Anhänge absenden" Button
- Dateien werden lokal hochgeladen (in Storage + DB mit Status `entwurf` statt `eingereicht`), aber noch nicht offiziell eingereicht.
- Alternativ (einfacher): Dateien werden weiterhin direkt hochgeladen, aber der Status bleibt `entwurf` bis der User den "Anhänge absenden" Button klickt — dann werden alle auf `eingereicht` gesetzt.
- Der Button ist nur aktiv, wenn **alle** required attachments eine Datei haben.
- Nach dem Absenden sind die Anhänge nicht mehr ersetzbar (bis ggf. Admin ablehnt).

### Betroffene Datei
- `src/pages/mitarbeiter/AuftragDetails.tsx` — Zeilen 575-660 (Attachments-Bereich)

### DB-Änderung
- Migration: Neuer default-Status `entwurf` für `order_attachments` damit Uploads nicht sofort als eingereicht gelten. Bestehende Einträge bleiben unverändert.

