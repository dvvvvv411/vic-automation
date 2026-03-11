

# TAN-Code Auto-Paste aus SMS Watch

## Überblick

Wenn eine SMS einen TAN/Ident-Code enthält, wird in der SMS-Card unten rechts ein dezenter Pfeil-Button angezeigt. Ein Klick darauf füllt automatisch:
1. Das "Code"-Eingabefeld im Header (`quickSmsCode`)
2. Das Chat-Eingabefeld (über `externalValue`)

Der Admin muss dann nur noch selbst absenden.

## Technische Umsetzung

### 1. TAN-Code Erkennung (Regex)
Typische Muster: "Code: 123456", "Ident-Code lautet: 12345", "TAN: 9876", oder einfach eine 4-8 stellige Zahl die allein steht.

```typescript
function extractTanCode(text: string): string | null {
  // Match patterns like "Code: 123456", "TAN: 1234", "Ident-Code lautet: 12345"
  const patterns = [
    /(?:code|tan|pin|ident)[:\s]+(\d{4,8})/i,
    /(\d{4,8})\s*\.?\s*$/,  // number at end of message
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}
```

### 2. SmsWatch Änderungen
- Neues Prop: `onTanCodeExtracted: (code: string) => void`
- In der SMS-Card: Wenn `extractTanCode(sms.messageText)` einen Code findet, einen kleinen `ArrowDownRight`-Button unten rechts anzeigen
- Klick ruft `onTanCodeExtracted(code)` auf

### 3. AdminLivechat Änderungen
- Neuer State `externalChatValue` für das Chat-Input
- Callback `handleTanCodeFromSms(code)`:
  - Setzt `quickSmsCode` auf den Code
  - Setzt `externalChatValue` auf den Code
- Wird an `SmsWatch` als `onTanCodeExtracted` übergeben
- `externalChatValue` wird an `ChatInput` als `externalValue` weitergereicht (dieses Prop existiert bereits)

### Dateien
| Datei | Änderung |
|-------|----------|
| `SmsWatch.tsx` | `extractTanCode` Funktion, neues Prop, Pfeil-Button in SMS-Card |
| `AdminLivechat.tsx` | State + Handler für TAN-Code, Prop-Durchreichung |

