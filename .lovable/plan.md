

# Anhänge-Pflicht nach Bewertung + Auftrags-Cards Update

## Übersicht
Drei zusammenhängende Änderungen:
1. **Bewertung.tsx**: Nach Bewertungsabgabe prüfen ob Anhänge nötig sind. Wenn ja → Status bleibt `offen`, Weiterleitung zur Auftragsdetail-Seite (Attachments-Step). Wenn nein → wie bisher `in_pruefung`.
2. **MitarbeiterAuftraege.tsx**: Neue Logik für Status `offen` + Bewertung vorhanden + Anhänge ausstehend → Badge "Anhänge erforderlich" + Button "Anhänge hinzufügen" statt "Auftrag starten".
3. **MitarbeiterDashboard.tsx**: Gleiche Logik wie bei Aufträge-Seite.

## Änderungen

### 1. `Bewertung.tsx` — handleSubmit anpassen (Zeilen 107-146)
- Order mit `required_attachments` laden (Zeile 77: `.select("id, title, review_questions, required_attachments")`)
- In handleSubmit: Prüfen ob `required_attachments` ein nicht-leeres Array ist
- **Wenn Anhänge nötig**: Status NICHT auf `in_pruefung` setzen (bleibt `offen`), nach Erfolg navigieren zu `/mitarbeiter/auftragdetails/${order.id}` (dort kann der User Anhänge hochladen)
- **Wenn keine Anhänge**: Wie bisher `in_pruefung` + navigate `/mitarbeiter`

### 2. `MitarbeiterAuftraege.tsx` — Cards + Button anpassen
- Zusätzlich `hasReviewSubmitted` boolean pro Assignment laden (Query auf `order_reviews` ob Einträge für order_id + contract_id existieren)
- Assignment-Interface erweitern: `hasReviewSubmitted: boolean`
- **StatusButton**: Neuen Fall hinzufügen: Wenn `status === "offen"` UND `hasReviewSubmitted` UND `attachmentsPending` → Button "Anhänge hinzufügen" (navigiert zu Auftragsdetails)
- **Badge**: Bei `status === "offen"` mit `attachmentsPending` und `hasReviewSubmitted` → Badge "Anhänge erforderlich" anzeigen

### 3. `MitarbeiterDashboard.tsx` — Gleiche Logik
- Auch hier `required_attachments`, `order_attachments` und `order_reviews` laden
- `OrderWithStatus` Interface erweitern: `attachmentsPending`, `hasReviewSubmitted`, `hasRequiredAttachments`
- StatusButton und Badge analog anpassen
- Dashboard filtert auch `offen` mit pending attachments als "Handlungsbedarf"

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `Bewertung.tsx` | `required_attachments` laden, Status-Logik in handleSubmit |
| `MitarbeiterAuftraege.tsx` | Reviews laden, StatusButton + Badge für Anhänge-Fall |
| `MitarbeiterDashboard.tsx` | Reviews + Attachments laden, StatusButton + Badge |

