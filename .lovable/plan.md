

# Redesign: Erforderliche Anhänge Layout

## Problem
Die aktuelle Darstellung nutzt ein `grid-cols-2 md:grid-cols-3` mit `aspect-square` Cards, was bei langen Beschreibungstexten verbuggt aussieht. Hochgeladene Dateien werden nur als Textlinks angezeigt statt als Thumbnails.

## Lösung

### 1. Layout: Vertikale Cards statt Grid
- Grid entfernen, stattdessen `space-y-4` mit voller Breite pro Anhang
- Jede Attachment-Card horizontal: Links Thumbnail/Upload-Bereich, rechts Titel + Beschreibung + Status + Aktionen
- `aspect-square` entfernen

### 2. Thumbnails für hochgeladene Dateien
- Für Bilder (png/jpg/jpeg): `<img>` Tag mit `object-cover` in einem festen quadratischen Container (z.B. `w-24 h-24 rounded-lg`)
- Für PDFs: FileText-Icon als Fallback im gleichen Container
- Klickbar zum Öffnen in neuem Tab

### Betroffene Datei
`src/pages/mitarbeiter/AuftragDetails.tsx` — Zeilen 802-845 (Attachments-Grid im `flowStep === "attachments"` Block)

### Struktur pro Card
```text
┌─────────────────────────────────────────────────┐
│ [Thumbnail 96x96]  │  Anhang 1 – Brief: Online-PIN    │
│   oder Upload-Box   │  Beschreibungstext...             │
│                     │  [Badge: Entwurf]                 │
│                     │  [Ersetzen-Button]                │
└─────────────────────────────────────────────────┘
```

