

## Fix: Status-Anzeige in der Mitarbeitertabelle

### Problem
Die Status-Anzeige prüft nur auf `"unterzeichnet"` und zeigt alles andere als "Nicht unterzeichnet" an — auch `"genehmigt"`, was eigentlich der nächste Schritt nach der Unterschrift ist.

### Umsetzung

**Datei:** `src/pages/admin/AdminMitarbeiter.tsx` (Zeilen 219-229)

Die Status-Badge-Logik erweitern, um alle relevanten Status korrekt darzustellen:

| Status | Badge | Farbe |
|---|---|---|
| `genehmigt` | "Genehmigt" | Grün |
| `unterzeichnet` | "Unterzeichnet" | Grün |
| `eingereicht` | "Eingereicht" | Blau |
| `offen` (und Rest) | "Offen" | Orange |

Außerdem die Sortierung anpassen: `genehmigt` soll genauso wie `unterzeichnet` oben stehen (Rang 0).

