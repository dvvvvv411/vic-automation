

## Plan: Dezentere Aktions-Buttons + Bestätigungsdialog bei Ablehnen

### Änderungen in `src/pages/admin/AdminAnhaenge.tsx`

1. **Buttons zu Icon-Only**: Text "Genehmigen"/"Ablehnen" entfernen, nur `CheckCircle`/`XCircle` Icons als `size="icon"` Buttons mit Tooltip anzeigen
2. **AlertDialog bei Ablehnen**: State `rejectTarget` hinzufügen. Klick auf Ablehnen-Icon setzt den State (statt direkt zu mutieren). Ein `AlertDialog` fragt "Alle Anhänge ablehnen?" mit Bestätigen/Abbrechen.
3. **Import**: `AlertDialog*`-Komponenten + `Tooltip*` aus ui importieren

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminAnhaenge.tsx` | Icon-only Buttons, AlertDialog für Ablehnen, Tooltip für Hover-Labels |

