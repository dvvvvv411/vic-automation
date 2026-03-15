

# Abstand zwischen Gradient-Header und Content in 3 Tabs

## Problem
Die Cards in den Tabs Personalausweis, Aufträge und Bewertungen haben kein Top-Padding auf `CardContent` (Standard ist `p-6 pt-0`). Die Zugangsdaten- und Notizen-Cards nutzen `pt-4` — das fehlt bei den drei Tab-Cards.

## Änderungen in `AdminMitarbeiterDetail.tsx`

Drei Zeilen ändern — jeweils `pt-4` hinzufügen:

1. **Personalausweis** (Zeile 833): `<CardContent>` → `<CardContent className="pt-4">`
2. **Aufträge** (Zeile 874): `<CardContent>` → `<CardContent className="pt-4">`
3. **Bewertungen** (Zeile 930): `<CardContent>` → `<CardContent className="pt-4">`

