

## Plan: Dashboard-Link SMS Button für alle Probetag-Termine verfügbar machen

### Problem
Der blaue Link2-Button (Dashboard-Link per Spoof-SMS) wird aktuell nur bei Terminen mit Status "erfolgreich" angezeigt (Zeile 523). Er soll für alle Termine mit Telefonnummer verfügbar sein.

### Lösung

**Datei: `src/pages/admin/AdminProbetag.tsx`**, Zeile 522-534

Die Bedingung `item.status === "erfolgreich" && item.applications?.phone` ändern zu nur `item.applications?.phone`, damit der Button unabhängig vom Status angezeigt wird.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminProbetag.tsx` | Status-Bedingung beim Spoof-SMS Button entfernen |

