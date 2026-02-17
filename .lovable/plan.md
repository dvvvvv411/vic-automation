

# Admin Dashboard Badges aufwerten - Farbige Status-Badges

## Problem
Die Badges im Admin Dashboard (`/admin`) sind langweilig und farblos. Sie verwenden `variant="outline"` ohne jegliche Farbgestaltung. Waehrend andere Admin-Seiten (Bewerbungen, Bewertungen) bereits farbige Badges mit Hintergrund und passenden Rahmenfarben haben, fehlt das im Dashboard komplett.

## Betroffene Stellen

1. **AdminDashboard.tsx** - `statusMap` hat nur Labels, keine Farbkonfiguration. Badges bei "Neueste Bewerbungen" und "Heutige Gespraeche" sind einfach grau/outline.

2. **AdminMitarbeiter.tsx** - Status-Badge ist hardcoded auf eine orange "Nicht unterzeichnet"-Badge (wird separat im anderen Plan behandelt).

## Loesung

### AdminDashboard.tsx - Farbige Status-Badges

Die `statusMap` wird zu einer `statusConfig` mit Farben umgebaut (gleiches Muster wie in AdminBewerbungen/AdminBewertungen):

| Status | Farbe | Label |
|--------|-------|-------|
| neu | Blau (primary) | Neu |
| eingeladen | Gelb/Amber | Eingeladen |
| bewerbungsgespraech | Gelb | Bewerbungsgespraech |
| termin_gebucht | Gruen | Termin gebucht |
| erfolgreich | Gruen | Erfolgreich |
| abgelehnt | Rot/Destructive | Abgelehnt |
| ausstehend | Gelb/Amber | Ausstehend |

Jede Badge bekommt:
- Einen farbigen Rahmen (`border-{color}-300`)
- Einen leichten farbigen Hintergrund (`bg-{color}-50`)
- Passende Textfarbe (`text-{color}-600`)

### Stat-Cards im Dashboard aufwerten
- Jede Stat-Card bekommt eine individuelle Akzentfarbe statt einheitlich `primary`
- Kleine farbige Indikator-Dots oder dezente farbige Akzente

## Technische Aenderungen

**Datei:** `src/pages/admin/AdminDashboard.tsx`

1. `statusMap` (Zeile 108-113) wird durch eine `statusConfig` ersetzt mit `label`, `className` pro Status
2. Badge-Rendering in "Neueste Bewerbungen" (Zeile 166) und "Heutige Gespraeche" (Zeile 192) wird aktualisiert, um die Farb-Klassen aus der Config zu verwenden
3. Die Interview-Status-Badges ("Heutige Gespraeche") bekommen ebenfalls passende Farben
4. Stat-Cards bekommen pro Karte eine individuelle Akzentfarbe (z.B. Blau fuer Bewerbungen, Gruen fuer Gespraeche, Orange fuer Vertraege, Lila fuer Termine, Rot fuer Chats)

Keine neuen Abhaengigkeiten oder Datenbankabfragen noetig - rein visuelles Upgrade.
