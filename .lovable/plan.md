

# Änderungen: Anhänge-Status-Buttons & Labels

## 1. Mitarbeiter-Übersicht: Button nach Einreichung ändern

**Problem**: Nachdem der User Anhänge eingereicht hat, zeigt der Button auf `/mitarbeiter/auftraege` weiterhin "Anhänge einreichen" statt "In Überprüfung".

**Lösung in `MitarbeiterAuftraege.tsx`**:
- Beim Laden der Attachments prüfen, ob alle eingereicht (nicht nur `genehmigt`) sind
- `attachmentsPending` nur `true` setzen wenn Anhänge noch im Status `entwurf` oder fehlend sind
- Aktuell: `attachmentsPending = hasReq && !allApproved` — das bleibt auch nach Einreichung `true`, weil `eingereicht !== genehmigt`
- Fix: `attachmentsPending` auf `false` setzen wenn alle Anhänge mindestens `eingereicht` sind (nicht nur `genehmigt`)
- Neuer Zustand `attachmentsSubmitted` für den Fall dass alle eingereicht aber noch nicht genehmigt → Button zeigt "In Überprüfung"

**StatusButton**: Neuen Fall hinzufügen wenn `attachmentsSubmitted && !attachmentsPending` → disabled Button "Anhänge in Überprüfung" (ähnlich wie `in_pruefung`)

## 2. AuftragDetails Overview: Eingereichte Anhänge anzeigen

**Problem**: Wenn der User den Auftrag wieder öffnet und Anhänge eingereicht hat, sieht er nur "In Überprüfung" aber nicht seine hochgeladenen Anhänge.

**Lösung in `AuftragDetails.tsx`** (Zeilen ~440-475):
- Unter der "In Überprüfung" Card: Wenn Anhänge eingereicht sind, eine zusätzliche Card mit Thumbnails der hochgeladenen Dateien anzeigen (read-only, ohne Upload-Buttons)
- Gleiche Thumbnail-Logik wie im Attachments-Step verwenden

## 3. Admin Anhänge-Detail: Richtige Labels anzeigen

**Problem**: `getAttachmentLabel` sucht nach `item.label`, aber die `required_attachments` haben `item.title`.

**Fix in `AdminAnhaengeDetail.tsx`** (Zeile 83):
- Ändern von `(item as any)?.label` zu `(item as any)?.title`

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `MitarbeiterAuftraege.tsx` | `attachmentsPending` Logik + neuer `attachmentsSubmitted` State + StatusButton Anpassung |
| `AuftragDetails.tsx` | Eingereichte Anhänge als Thumbnails unter "In Überprüfung" Card anzeigen |
| `AdminAnhaengeDetail.tsx` | `label` → `title` im `getAttachmentLabel` |

