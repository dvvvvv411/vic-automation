

# AdminAuftraege: Von Tabelle zu Premium-Cards

## Ziel
Die Tabellen-Ansicht durch ein Card-basiertes Layout ersetzen, wie im Screenshot gezeigt.

## Design pro Card (wie Screenshot)
Jede Order wird als `premium-card` dargestellt:
- **Header-Zeile**: Titel (fett) + Stern-Icon (wenn Starter-Job) + Prämie-Badge + Typ-Badge — rechts: "Ansehen" (Eye-Icon), "Zuweisen" (Users-Icon), Drei-Punkte-Menü (Bearbeiten/Löschen)
- **Body**: Beschreibung (2-3 Zeilen, `text-muted-foreground`, `whitespace-pre-line`, `line-clamp-3`)
- **Footer-Zeile**: Clock-Icon + geschätzte Stunden | "Aktualisiert: DD.MM.YYYY"

## Aktionen
- "Ansehen" → navigiert zu `/admin/auftraege/{id}/bearbeiten`
- "Zuweisen" → öffnet AssignmentDialog
- Drei-Punkte-Menü (DropdownMenu): Bearbeiten, Löschen

## Weitere Anpassungen
- Staggered framer-motion Animationen pro Card
- Empty-State mit `border-dashed` Container
- Header mit Icon wie im Screenshot

## Betroffene Datei
- `src/pages/admin/AdminAuftraege.tsx`

