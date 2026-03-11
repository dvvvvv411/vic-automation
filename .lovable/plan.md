

# Fix: Mitarbeiter Online-Status wird Admin nicht angezeigt

## Ursache

Das `ChatWidget` (Mitarbeiter-Seite) verwendet `useChatPresence` nicht. Der Mitarbeiter sendet also nie seine Presence auf dem WebSocket-Channel. Der Admin lauscht zwar auf `role: "user"` Presences, aber niemand sendet sie.

## Lösung

In `ChatWidget.tsx` den `useChatPresence`-Hook importieren und aufrufen, damit der Mitarbeiter seine Anwesenheit broadcastet, wenn er den Chat geöffnet hat.

### Änderung in `src/components/chat/ChatWidget.tsx`

1. Import hinzufügen: `import { useChatPresence } from "./useChatPresence";`
2. Hook aufrufen mit `contractId`, `role: "user"` und `active: open` (nur tracken wenn Chat-Popup offen ist):

```typescript
useChatPresence({ contractId, role: "user", active: open });
```

Das ist eine 2-Zeilen-Änderung. Der bestehende Presence-Hook auf Admin-Seite empfängt dann die User-Presence und zeigt den grünen Punkt korrekt an.

| Datei | Änderung |
|-------|----------|
| `src/components/chat/ChatWidget.tsx` | `useChatPresence` importieren und aufrufen |

