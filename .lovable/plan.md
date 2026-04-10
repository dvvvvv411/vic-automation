

## Plan: Aktionen-Spalte in der Anhänge-Tabelle

### Was passiert
Eine neue Spalte "Aktionen" wird zur Tabelle auf `/admin/anhaenge` hinzugefügt. Dort erscheinen für Gruppen mit Status "Eingereicht" zwei Buttons: "Genehmigen" (grün) und "Ablehnen" (rot). Die Buttons führen die Sammelgenehmigung/-ablehnung direkt aus, ohne die Detailseite öffnen zu müssen. Die `tryAutoComplete`-Logik wird wiederverwendet.

### Änderungen in `src/pages/admin/AdminAnhaenge.tsx`

1. **Imports hinzufügen**: `useMutation`, `useQueryClient` von react-query, `Button` von ui, `CheckCircle`/`XCircle` von lucide, `toast`, und die `tryAutoComplete`-Funktion aus `AdminAnhaengeDetail.tsx` (wird dorthin exportiert oder inline dupliziert)

2. **Attachment-IDs mitladen**: In der Query zusätzlich die IDs der eingereichten Anhänge pro Gruppe sammeln (`pending_ids: string[]`)

3. **Mutations hinzufügen**: Bulk-Approve und Bulk-Reject Mutations (analog zur Detailseite), inkl. `tryAutoComplete`-Aufruf nach Genehmigung

4. **Neue Tabellenspalte**: `<TableHead>Aktionen</TableHead>` + `<TableCell>` mit Genehmigen/Ablehnen-Buttons (nur sichtbar wenn `statuses` eingereichte enthält). `colSpan` von 5 auf 6 anpassen. Click-Event auf Buttons mit `e.stopPropagation()` damit die Zeilen-Navigation nicht ausgelöst wird.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminAnhaengeDetail.tsx` | `tryAutoComplete` exportieren |
| `src/pages/admin/AdminAnhaenge.tsx` | Aktionen-Spalte + Mutations + pending_ids in Query |

Keine DB-Änderungen nötig.

