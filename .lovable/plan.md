

# AdminKunden Premium-Card Redesign

## Ziel
Die Kunden-Seite (`/admin/kunden`) an das Premium-Design von `/admin/arbeitsvertraege` angleichen: `premium-card` Klasse, Initialen-Avatar, inline-Layout statt Card/CardHeader.

## Änderungen in `src/pages/admin/AdminKunden.tsx`

### 1. Kunden-Liste: premium-card Layout
Ersetze die `<Card>/<CardHeader>` Struktur durch `premium-card` Divs mit dem gleichen Pattern wie Arbeitsverträge:
- Initialen-Avatar (runder Kreis mit `bg-primary/10 text-primary`)
- Name + Badge inline
- Anzahl zugewiesener Brandings als Info-Text mit Icon
- Action-Buttons rechts (Brandings-Settings, Delete) als ghost icon-buttons mit Tooltips

### 2. Expanded Brandings-Bereich
Wenn expandiert, wird der Branding-Bereich unterhalb der Card-Row in einem `bg-muted/30 rounded-lg p-4 mt-2` Container angezeigt, visuell zum premium-card passend.

### 3. Empty State
Statt plain Card ein `border border-dashed rounded-lg` Empty-State wie bei Arbeitsverträge.

### 4. Motion-Animationen
Staggered entry-Animationen pro Kunden-Card wie bei Arbeitsverträge (`delay: i * 0.03`).

### Betroffene Datei
- `src/pages/admin/AdminKunden.tsx`

