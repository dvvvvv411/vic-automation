

# Fix: Telegram-Benachrichtigung bei Bewerbungsgespraech-Buchung

## Problem

Die `sendTelegram`-Funktion wird in `Bewerbungsgespraech.tsx` **ohne `await`** aufgerufen (Zeile 116). Das bedeutet:

1. Die Buchung wird in die Datenbank geschrieben
2. `sendTelegram` wird als "Fire-and-Forget" gestartet (kein `await`)
3. Die `mutationFn` kehrt sofort zurueck
4. `onSuccess` wird ausgefuehrt, aendert den State (`setBooked(true)`)
5. Die Komponente rendert die Erfolgsseite -- der laufende Fetch-Request fuer Telegram wird moeglicherweise abgebrochen

Dasselbe Problem betrifft auch **alle anderen Stellen**, wo `sendTelegram` ohne `await` aufgerufen wird:
- `Arbeitsvertrag.tsx` (Vertrag eingereicht)
- `AuftragDetails.tsx` (Auftragstermin gebucht)
- `Bewertung.tsx` (Bewertung eingereicht)
- `useChatRealtime.ts` (Chat-Nachricht)

## Loesung

`sendTelegram` in allen Dateien mit `await` aufrufen, damit der Request abgeschlossen wird bevor die Mutation als fertig gilt.

## Aenderungen

### 1. `src/pages/Bewerbungsgespraech.tsx` (Zeile 116)

```typescript
// Vorher:
sendTelegram("gespraech_gebucht", ...);

// Nachher:
await sendTelegram("gespraech_gebucht", ...);
```

### 2. `src/pages/Arbeitsvertrag.tsx` (Zeile ~254)

```typescript
// Vorher:
sendTelegram("vertrag_eingereicht", ...);

// Nachher:
await sendTelegram("vertrag_eingereicht", ...);
```

### 3. `src/pages/mitarbeiter/AuftragDetails.tsx` (Zeile ~229)

```typescript
// Vorher:
sendTelegram("auftragstermin_gebucht", ...);

// Nachher:
await sendTelegram("auftragstermin_gebucht", ...);
```

### 4. `src/pages/mitarbeiter/Bewertung.tsx` (Zeile ~143)

```typescript
// Vorher:
sendTelegram("bewertung_eingereicht", ...);

// Nachher:
await sendTelegram("bewertung_eingereicht", ...);
```

### 5. `src/components/chat/useChatRealtime.ts` (Zeile ~84)

```typescript
// Vorher:
sendTelegram("chat_nachricht", ...);

// Nachher:
await sendTelegram("chat_nachricht", ...);
```

## Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| `src/pages/Bewerbungsgespraech.tsx` | `await` vor `sendTelegram` |
| `src/pages/Arbeitsvertrag.tsx` | `await` vor `sendTelegram` |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | `await` vor `sendTelegram` |
| `src/pages/mitarbeiter/Bewertung.tsx` | `await` vor `sendTelegram` |
| `src/components/chat/useChatRealtime.ts` | `await` vor `sendTelegram` |

## Warum das das Problem loest

Durch `await` wird sichergestellt, dass der HTTP-Request an die Edge Function vollstaendig abgeschlossen ist, **bevor** die Mutation als erledigt gilt und die UI sich aendert. Der Request kann nicht mehr durch einen Re-Render oder Navigation abgebrochen werden.

Da `sendTelegram` intern einen `try/catch` hat, blockiert ein Fehler bei der Telegram-Zustellung niemals die eigentliche Aktion (Buchung, Vertragseinreichung etc.) -- es wird nur gewartet bis der Versuch abgeschlossen ist.

