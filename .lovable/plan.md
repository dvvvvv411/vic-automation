

# SMS-Dialog im Livechat: Vorgefertigter Text mit Code-Eingabe

## Aenderung

Der SMS-Dialog im Admin-Livechat wird umgebaut: Statt einem freien Textfeld gibt es nur noch ein Eingabefeld fuer den Ident-Code. Der SMS-Text wird automatisch aus der Vorlage `Ihr Ident-Code lautet: {CODE}.` generiert.

## Betroffene Datei

`src/pages/admin/AdminLivechat.tsx`

### Aenderungen im Detail

1. **State umbenennen**: `smsText` wird zu `smsCode` (kurzer Code-String statt Freitext)
2. **Dialog-Inhalt anpassen**:
   - Textarea wird durch ein normales Input-Feld ersetzt (Label: "Ident-Code")
   - Darunter eine Vorschau des fertigen SMS-Textes: `Ihr Ident-Code lautet: {eingegebener Code}.`
   - Zeichenzaehler entfaellt (Code ist immer kurz)
3. **Sende-Logik anpassen**: Beim Klick auf "SMS senden" wird der Text `Ihr Ident-Code lautet: ${smsCode}.` zusammengesetzt und an `sendSms()` uebergeben
4. **Validierung**: Button bleibt deaktiviert wenn kein Code eingegeben wurde

