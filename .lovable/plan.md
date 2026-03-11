

# Bewertung-Freischalten: Button statt Toggle

## Änderung in `MitarbeiterDetailPopup.tsx`

Den `Switch`-Toggle in der Bewertungs-Spalte durch einen `Button` ersetzen:

- **Nicht freigeschaltet**: Button "Freischalten" (outline/secondary style)
- **Bereits freigeschaltet**: Badge "Freigeschaltet" (grün) -- kein Button mehr nötig, da die Aktion einmalig ist
- **Platzhalter-Aufträge**: Badge "Auto" bleibt wie bisher

Import von `Switch` entfernen, `Button` importieren.

| Datei | Änderung |
|-------|----------|
| `MitarbeiterDetailPopup.tsx` | Switch durch Button "Freischalten" ersetzen, Import anpassen |

