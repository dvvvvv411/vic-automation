
# Fix: Test-Nachricht sendet an alle konfigurierten Chats

## Problem

Der Test-Button sendet `event_type: "test"`, aber keine Chat-ID hat das Event `"test"` abonniert. Die Edge Function filtert mit `contains("events", ["test"])` und findet 0 Treffer.

## Loesung

Den Test-Button so aendern, dass er an **alle** konfigurierten Chats sendet, unabhaengig von deren Event-Abonnements. Dazu wird ein spezieller Event-Typ `"_test"` verwendet und die Edge Function angepasst.

### 1. Edge Function (`supabase/functions/send-telegram/index.ts`)

Vor dem Datenbankabfrage pruefen, ob `event_type === "_test"`. Wenn ja, alle Chats laden (ohne Event-Filter):

```typescript
let query = adminClient.from("telegram_chats").select("chat_id");
if (event_type === "_test") {
  // Alle Chats, unabhaengig von abonnierten Events
} else {
  query = query.contains("events", [event_type]);
}
```

### 2. AdminTelegram.tsx (Zeile 103)

Event-Typ von `"test"` auf `"_test"` aendern und Erfolgsmeldung anpassen:

```typescript
body: { event_type: "_test", message: "..." }
```

Erfolgsmeldung: "Testnachricht an alle Chat-IDs gesendet"

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/send-telegram/index.ts` | Test-Event Sonderbehandlung |
| `src/pages/admin/AdminTelegram.tsx` | Event-Typ und Toast-Text |
