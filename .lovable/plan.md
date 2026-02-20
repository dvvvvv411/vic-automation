
# Cutoff auf 3 Stunden aendern + Bestaetigungs-Popup fuer SMS

## Uebersicht

Zwei Aenderungen in `src/pages/admin/AdminBewerbungsgespraeche.tsx`:

1. **Cutoff von 1 auf 3 Stunden**: Ein Termin gilt erst als "vergangen", wenn er 3 Stunden alt ist (statt bisher 1 Stunde).
2. **Bestaetigungs-Dialog vor SMS-Versand**: Beim Klick auf das SMS-Symbol oeffnet sich ein Dialog, der den SMS-Text anzeigt. Erst nach Bestaetigung wird die SMS + E-Mail gesendet.

## Aenderungen in `src/pages/admin/AdminBewerbungsgespraeche.tsx`

### 1. Cutoff aendern

Zeile 35 aendern von `subHours(now, 1)` auf `subHours(now, 3)`.

### 2. Bestaetigungs-Dialog

- Neue States: `reminderPreview` (speichert das Item + den vorbereiteten SMS-Text) 
- Beim Klick auf den SMS-Button: Branding und Template laden, SMS-Text zusammenbauen, dann `reminderPreview` setzen (Dialog oeffnet sich)
- Dialog zeigt: Empfaenger-Name, Telefonnummer und den fertigen SMS-Text an
- "Senden"-Button im Dialog fuehrt den eigentlichen Versand durch (SMS + E-Mail)
- "Abbrechen" schliesst den Dialog
- Imports: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` hinzufuegen

### Ablauf

```text
Klick auf SMS-Icon
  -> Branding + Template laden
  -> SMS-Text mit Platzhaltern befuellen
  -> Dialog oeffnen mit Vorschau
  -> User klickt "Senden"
  -> sendSms() + sendEmail() ausfuehren
  -> Toast + Dialog schliessen
```

## Keine Datenbank-Aenderungen

Nur Frontend-Aenderungen in einer einzigen Datei.
