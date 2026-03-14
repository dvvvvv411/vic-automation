
# Verlauf-Card Höhe an Nachricht-senden-Card binden

Die Verlauf-Card (rechts) soll nie höher als die Nachricht-senden-Card (links) sein. Überlaufende History-Einträge werden scrollbar.

## Änderungen in `src/pages/admin/AdminSmsSpoof.tsx`

1. **Grid-Container**: `items-start` hinzufügen damit Karten nicht gleich hoch gestreckt werden → eigentlich brauchen wir das Gegenteil: Die rechte Card soll sich an die linke anpassen.

2. **Ansatz**: Das 50/50-Grid bekommt `items-stretch` (default bei CSS Grid), aber die rechte Card bekommt intern `h-full` mit `flex flex-col` und der Content-Bereich bekommt `overflow-auto min-h-0 flex-1`. Dadurch passt sich die rechte Card an die Höhe der linken an und der Inhalt scrollt bei Überlauf.

### Konkret:
- **Rechte Card** (`<Card>` bei Zeile 436): `className="h-full flex flex-col"` hinzufügen
- **CardContent** (Zeile 442): `className="flex-1 min-h-0 overflow-auto"` hinzufügen  
- **Bestehenden `max-h-[420px]`** auf dem Table-Container (Zeile 453) entfernen, da das Scrolling jetzt vom CardContent gesteuert wird
- **Linke Card** bleibt unverändert – sie bestimmt die natürliche Höhe
