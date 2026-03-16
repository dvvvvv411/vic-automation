

# Fix: Auftrag nur "erfolgreich" wenn Bewertung UND Anhänge genehmigt

## Problem

`AdminBewertungen.tsx` setzt bei Review-Genehmigung sofort `status = "erfolgreich"` — ohne zu prüfen ob Pflichtanhänge existieren und ob diese genehmigt sind. Ebenso fehlt in `AdminAnhaengeDetail.tsx` die Gegenprüfung nach Anhänge-Genehmigung.

## Änderungen

### 1. `AdminBewertungen.tsx` — `handleApprove` (Zeile 135-200)

Vor dem Status-Update:
- Order laden mit `required_attachments`
- Falls `required_attachments` nicht leer: `order_attachments` laden und prüfen ob alle den Status `"genehmigt"` haben
- Alle Anhänge genehmigt → `"erfolgreich"` + Prämie + Benachrichtigungen (wie bisher)
- Anhänge fehlen oder nicht alle genehmigt → `"in_pruefung"` setzen, keine Prämie, Toast: "Bewertung genehmigt. Anhänge stehen noch aus."
- Keine `required_attachments` → wie bisher `"erfolgreich"`

### 2. `AdminAnhaengeDetail.tsx` — Auto-Abschluss nach Anhänge-Genehmigung

Nach `bulkApproveMutation` und `updateMutation` (`onSuccess`):
- Prüfen ob nach dem Update alle Anhänge des Auftrags `"genehmigt"` sind
- Falls ja: `order_assignments` laden für diesen Order+Contract
- Falls `status === "in_pruefung"` (= Review wurde bereits genehmigt): 
  - Status auf `"erfolgreich"` setzen
  - Prämie gutschreiben (Order `reward` laden, Balance erhöhen)
  - Toast: "Auftrag abgeschlossen und Prämie gutgeschrieben"
- Falls Status noch `"offen"` → nichts tun (Bewertung fehlt noch)

### 3. Mitarbeiter-Button-Logik — bereits korrekt

Die StatusButton-Logik zeigt schon jetzt korrekt:
- `attachmentsPending=true` + `status="in_pruefung"` → "Anhänge einreichen" (attachmentsPending hat Vorrang)
- `attachmentsSubmitted=true` → "In Überprüfung"

Das funktioniert automatisch sobald `handleApprove` den Status auf `"in_pruefung"` statt `"erfolgreich"` setzt.

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `AdminBewertungen.tsx` | `handleApprove`: Anhänge-Check vor finaler Status-Entscheidung |
| `AdminAnhaengeDetail.tsx` | Auto-Abschluss-Logik nach Anhänge-Genehmigung |

