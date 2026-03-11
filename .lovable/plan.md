

# Fix: TAN-Code Erkennung für "SMS Code ein: 750637"

## Problem

Die Regex `/(?:code|tan|pin|ident)[\s\-:]*(\d{4,8})/i` matcht nur direkt nach dem Keyword folgende Leerzeichen/Doppelpunkte/Bindestriche. Bei "SMS Code ein: 750637" steht aber das Wort "ein" dazwischen, das nicht gematcht wird.

## Lösung

Regex in `extractTanCode` erweitern, sodass zwischen Keyword und Zahl auch kurze Wörter stehen dürfen:

```typescript
function extractTanCode(text: string): string | null {
  const patterns = [
    /(?:code|tan|pin|ident|clave)[\s\-:]*(?:\w+[\s\-:]+)?(\d{4,8})/i,
    /(\d{4,8})\s*\.?\s*$/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}
```

Die Änderung `(?:\w+[\s\-:]+)?` erlaubt optional ein Wort (wie "ein", "es", "ist", "lautet") zwischen Keyword und Zahl.

**Datei:** `src/components/chat/SmsWatch.tsx` Zeile 36

