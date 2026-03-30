

## Plan: Auftrag kopieren Aktion

### Umsetzung

**1. `AdminAuftraege.tsx`** — Neue DropdownMenuItem "Kopieren" mit Copy-Icon hinzufuegen, die per `navigate` auf `/admin/auftraege/neu?copy=${o.id}` weiterleitet.

**2. `AdminAuftragWizard.tsx`** — Den `copy` Query-Parameter auslesen (`useSearchParams`). Wenn `copy` vorhanden, die Daten des Quell-Auftrags laden (gleiche Query wie beim Editieren), ins Formular einfuellen, aber `isEditing` bleibt `false` — damit wird beim Speichern ein neuer Auftrag per INSERT angelegt statt UPDATE. Titel bekommt ein " (Kopie)" Suffix.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminAuftraege.tsx` | DropdownMenuItem "Kopieren" mit Navigation zu `/admin/auftraege/neu?copy=ID` |
| `src/pages/admin/AdminAuftragWizard.tsx` | `useSearchParams` fuer `copy`-Param, Quell-Auftrag laden und Formular befuellen |

