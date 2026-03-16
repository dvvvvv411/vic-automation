

# Plan: Appstore/Playstore Buttons aus Dashboard-Auftrags-Cards entfernen

## Änderung

In `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` den Block Zeilen 490-515 entfernen, der die App Store und Play Store Links in den Auftrags-Cards rendert. Außerdem die ungenutzten Imports `Apple` und `Play` aus Zeile 4 entfernen.

Die Store-Links bleiben weiterhin in der Detailansicht (`AuftragDetails.tsx`) verfügbar.

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `MitarbeiterDashboard.tsx` | Store-Links Block (Z. 490-515) + unused Imports entfernen |

