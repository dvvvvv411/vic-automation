
# Schnelleingabe fuer Ident-Code im Livechat-Header

## Aenderung

Neben dem bestehenden SMS-Button im Chat-Header wird ein kompaktes Inline-Eingabefeld mit Haken-Button eingefuegt. Der Admin kann dort direkt einen Ident-Code eingeben und mit einem Klick auf den Haken absenden -- ohne den Dialog oeffnen zu muessen. Der Dialog bleibt weiterhin ueber den Smartphone-Button erreichbar.

## Betroffene Datei

`src/pages/admin/AdminLivechat.tsx`

### Aenderungen im Detail

1. **Neuer State**: `quickSmsCode` (String) fuer das Inline-Eingabefeld
2. **UI im Header** (Zeile 243-253): Nach dem SMS-Button wird ein kleines Input-Feld (ca. 80px breit, Placeholder "Code") und ein Check-Button (Lucide `Check`-Icon) eingefuegt, beides nur sichtbar wenn `contractData.phone` vorhanden ist
3. **Neue Funktion `handleQuickSms`**: 
   - Nutzt dieselbe Logik wie `handleSendSms` (Branding laden, `sms_sender_name` holen)
   - Setzt den Text auf `Ihr Ident-Code lautet: ${quickSmsCode.trim()}.`
   - Sendet die SMS, zeigt Toast, leert das Feld bei Erfolg
4. **Layout**: Die Elemente werden in einer `flex items-center gap-1` Gruppe angeordnet:
   - SMS-Button (Smartphone-Icon, oeffnet Dialog)
   - Input-Feld (schmal, h-9)
   - Check-Button (h-9 w-9, primary-Farbe, disabled wenn leer oder beim Senden)

### Visuelles Layout im Header

```text
[Mitarbeiter-Avatar + Name]          [Input: Code] [✓] [📱] [Templates] [Admin-Avatar]
```

Das Input + Haken steht direkt vor dem bestehenden SMS-Dialog-Button.
