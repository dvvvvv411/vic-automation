

## Plan: Checkbox statt separatem Eingabefeld fuer "Nummer zum Branding hinzufuegen"

### Aenderung

**Datei:** `src/pages/admin/AdminIdentDetail.tsx`

1. **Entfernen:** Den gesamten "Neue Nummer zum Branding hinzufuegen"-Bereich (Zeilen 436-459: Separator + Label + Input + Button)

2. **Hinzufuegen:** Unter dem manuellen Share-Link-Input (nach Zeile 434) eine Checkbox mit Label "Nummer auch zum Branding hinzufuegen"

3. **State:** Neuer `useState<boolean>` fuer `addToBranding` (default: `false`)

4. **Logik anpassen:** In `handleAssignPhone` – wenn `addToBranding` aktiviert ist UND die URL nicht bereits in `phoneEntries` existiert, automatisch auch in `phone_numbers`-Tabelle einfuegen (mit `branding_id` aus der Session). Die bestehende `handleAddNewPhone`-Funktion und ihre States (`newPhoneLink`, `addingPhone`) werden entfernt.

