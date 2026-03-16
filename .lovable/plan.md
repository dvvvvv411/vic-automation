

# Plan: Dashboard "In Überprüfung" + Text Fix + Bulk-Genehmigung

## 3 Änderungen

### 1. `MitarbeiterDashboard.tsx` — `attachmentsSubmitted` hinzufügen

- Interface `OrderWithStatus` (Zeile 31): `attachmentsSubmitted: boolean` ergänzen
- StatusButton Props (Zeile 45-46): `attachmentsSubmitted` hinzufügen
- StatusButton Body (vor Zeile 49): Gleicher Check wie in `MitarbeiterAuftraege.tsx` — wenn `attachmentsSubmitted && !attachmentsPending`, disabled Button "In Überprüfung" anzeigen
- Logik im `useEffect` (Zeile 215-229): `allSubmitted` berechnen (alle required attachments haben Status `eingereicht` oder `genehmigt`), `attachmentsPending: hasReq && !allSubmitted`, `attachmentsSubmitted: allSubmitted && !allApproved`

### 2. Text ändern: "Anhänge in Überprüfung" → "In Überprüfung"

- `MitarbeiterAuftraege.tsx` Zeile 68: Text ändern

### 3. `AdminAnhaengeDetail.tsx` — "Alle genehmigen" Button

- Über der Card-Grid einen Button "Alle genehmigen" einfügen, der nur erscheint wenn mindestens ein Anhang Status `eingereicht` hat
- Neue `bulkMutation` die alle `eingereicht` Anhänge auf `genehmigt` setzt (Loop über alle IDs)
- Button-Style: grün, prominent

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `MitarbeiterDashboard.tsx` | attachmentsSubmitted State + StatusButton |
| `MitarbeiterAuftraege.tsx` | Text fix |
| `AdminAnhaengeDetail.tsx` | "Alle genehmigen" Button |

