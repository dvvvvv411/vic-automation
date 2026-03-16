

## Problem

`AssignmentDialog` zeigt bei `mode="order"` nur Mitarbeiter mit Status `unterzeichnet` an. Die Mitarbeiter-Übersicht (`/admin/mitarbeiter`) zeigt aber alle mit Status `offen`, `eingereicht`, `genehmigt` und `unterzeichnet`.

## Lösung

In `src/components/admin/AssignmentDialog.tsx` Zeile 76 den Filter `.eq("status", "unterzeichnet")` ersetzen durch `.in("status", ["offen", "eingereicht", "genehmigt", "unterzeichnet"])`, damit alle Mitarbeiter angezeigt werden die auch in der Mitarbeiter-Übersicht sichtbar sind.

Zusätzlich den `.not("first_name", "is", null)` Filter hinzufügen (wie in AdminMitarbeiter), damit leere Einträge ohne Namen nicht erscheinen.

**Datei:** `src/components/admin/AssignmentDialog.tsx`, Zeile 73-78

