

## Fix: Platzhalter in Vertragsvorschau ersetzen

### Problem
1. **MeineDaten.tsx** (Arbeitsvertrag anzeigen): `templateContent` wird roh angezeigt ohne Platzhalter-Ersetzung — `{{ startdatum }}` bleibt sichtbar
2. **MitarbeiterArbeitsvertrag.tsx** (Vorschau-Popup bei Vorlagenauswahl): Zeigt ebenfalls rohen Content ohne Ersetzung — Zeilen mit `{{ variablen }}` sollen hier ausgeblendet werden, da der User noch keine Daten eingegeben hat

### Aenderungen

**1. `MeineDaten.tsx` — Zeile 252-267 + Zeile 415**
- Beim Laden des Vertrags zusaetzlich `desired_start_date`, `birth_place`, `nationality`, `marital_status`, `social_security_number`, `tax_id`, `phone`, `email`, `employment_type` laden (teilweise schon da)
- `salary` aus Template mitspeichern
- Neue Hilfsfunktion `replaceContractPlaceholders(content)` die alle `{{ variable }}`-Platzhalter mit den geladenen Vertragsdaten ersetzt (gleiche Logik wie in MitarbeiterArbeitsvertrag.tsx)
- In Zeile 415 `templateContent` durch `replaceContractPlaceholders(templateContent)` ersetzen

**2. `MitarbeiterArbeitsvertrag.tsx` — Zeile 1088-1090 (Vorschau-Dialog bei Vorlagenauswahl)**
- Content durch eine Funktion filtern die alle HTML-Absaetze/Zeilen entfernt, die `{{ ... }}` Platzhalter enthalten
- Einfache Regex: Alle `<p>...</p>` oder `<li>...</li>` Bloecke die `{{` enthalten werden ausgeblendet

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `MeineDaten.tsx` | Platzhalter-Ersetzung mit Vertragsdaten |
| `MitarbeiterArbeitsvertrag.tsx` | Zeilen mit Variablen im Vorschau-Popup ausblenden |

