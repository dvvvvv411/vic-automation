

# Fixes: Anhänge-Badge + Button auf Dashboard und Aufträge-Seite

## Probleme

1. **Dashboard (`MitarbeiterDashboard.tsx`)**: Badge "Anhänge erforderlich" wird nur bei `status === "offen"` angezeigt, aber nicht bei `in_pruefung` mit ausstehenden Anhängen.
2. **Beide Seiten**: Der StatusButton zeigt bei `in_pruefung` + `attachmentsPending` nur den disabled "In Überprüfung"-Button statt einen aktiven "Anhänge einreichen"-Button.
3. **Bestehende Daten**: Es gibt bereits einen Auftrag mit `in_pruefung` + Review vorhanden + 0 Anhänge hochgeladen (vor dem Fix gesetzt).

## Änderungen

### 1. `MitarbeiterDashboard.tsx` — StatusButton (Zeile 45-104)
- **Vor** dem `switch`: Zusätzliche Prüfung: wenn `attachmentsPending` (egal welcher Status außer `erfolgreich`), dann "Anhänge einreichen"-Button anzeigen
- Badge-Bedingung (Zeile 442): Auch bei `in_pruefung` das Badge "Anhänge erforderlich" zeigen

### 2. `MitarbeiterAuftraege.tsx` — StatusButton (Zeile 59-118)
- Gleiche Logik: `attachmentsPending` hat Vorrang über den regulären Status-Switch (außer `erfolgreich`)
- Badge-Bedingung (Zeile 288): Bereits vorhanden für `offen`, auch für `in_pruefung` ergänzen (Zeile 294 existiert schon mit "Anhänge ausstehend" — dort den Button-Text auch auf "Anhänge einreichen" ändern)

### 3. Konkreter StatusButton-Fix (beide Dateien)
```text
// Vor dem switch-Statement:
if (attachmentsPending && status !== "erfolgreich") {
  → Button "Anhänge einreichen" mit Paperclip-Icon
  → navigiert zu /mitarbeiter/auftragdetails/{orderId}
}
```

### 4. `AuftragDetails.tsx` — handleSubmitAttachments (Zeile 331-344)
- Nach erfolgreichem Einreichen der Anhänge: Prüfen ob eine Review existiert, und wenn ja, den Status auf `in_pruefung` setzen (falls er noch `offen` war)

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `MitarbeiterDashboard.tsx` | StatusButton: attachmentsPending-Check vor switch; Badge auch bei in_pruefung |
| `MitarbeiterAuftraege.tsx` | StatusButton: attachmentsPending-Check vor switch |
| `AuftragDetails.tsx` | handleSubmitAttachments: nach Upload Status auf in_pruefung setzen wenn Review existiert |

