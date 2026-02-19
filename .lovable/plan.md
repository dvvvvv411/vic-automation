

# Fix: seven.io Response "100" korrekt erkennen

## Problem

`JSON.parse("100")` wirft keinen Fehler -- es gibt die Zahl `100` zurueck. Daher wird der catch-Block nie erreicht, und `parsed.success` ist `undefined`, weil `100` kein Objekt ist.

## Loesung

In `supabase/functions/send-sms/index.ts` die Erfolgs-Pruefung anpassen (Zeilen 74-82):

```typescript
let success = false;
try {
  const parsed = JSON.parse(smsResult);
  if (typeof parsed === "number") {
    success = parsed === 100;
  } else if (typeof parsed === "object" && parsed !== null) {
    success = parsed.success === "100" || parsed.success === 100
      || (parsed.messages && parsed.messages.length > 0);
  }
} catch {
  success = smsResult.trim().startsWith("100");
}
```

Die Aenderung prueft zuerst ob `parsed` eine Zahl ist (seven.io gibt oft einfach `100` zurueck). Nur wenn es ein Objekt ist, werden `success` und `messages` geprueft.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/send-sms/index.ts` | typeof-Pruefung fuer parsed Response |

