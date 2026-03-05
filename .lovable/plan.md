

# Per-Chat SMS Watch & Typing Preview Fix

## Problem 1: SMS Watch ist global
`SmsWatch` speichert `selectedEntry` in einem einzigen `useState` -- beim Wechsel zwischen Chats bleibt die gleiche Nummer ausgewaehlt.

**Loesung:** `contractId` als Prop uebergeben. Die ausgewaehlte Nummer wird in einer `Map<contractId, PhoneEntry>` (via `useRef`) gespeichert, sodass jeder Chat seine eigene Auswahl hat.

## Problem 2: Typing/Draft Preview leckt zwischen Chats
`useChatTyping` setzt `isTyping` und `draftPreview` beim Channel-Wechsel nicht zurueck. Wenn Helena tippt und der Admin zu Selinas Chat wechselt, bleibt die alte Preview sichtbar bis der Timeout greift.

**Loesung:** Im `useEffect` von `useChatTyping` am Anfang `setIsTyping(false)` und `setDraftPreview(null)` aufrufen, wenn sich `contractId` aendert.

## Aenderungen

| Datei | Aenderung |
|---|---|
| `SmsWatch.tsx` | `contractId` Prop, `useRef(Map)` fuer per-Chat Nummer-Auswahl |
| `useChatTyping.ts` | State reset bei `contractId`-Wechsel |
| `AdminLivechat.tsx` | `contractId` an `<SmsWatch>` uebergeben |

