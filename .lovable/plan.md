

# Nur Chats mit Nachrichten in der Livechat-Liste anzeigen

## Problem
Nach der letzten Änderung werden alle Contracts in der Konversationsliste angezeigt – auch solche ohne Nachrichten und ohne Namen. Nur der Livechat-Button auf der Mitarbeiter-Detailseite soll einen leeren Chat öffnen können.

## Lösung

**Datei: `src/pages/admin/AdminLivechat.tsx`** (Zeilen 149-167)

Die `.map()` zurück zu `.filter()` + `.map()` ändern: Nur Contracts anzeigen, die einen Eintrag in der `map` haben (d.h. mindestens eine Nachricht existiert). Der Deep-Link-Mechanismus (Zeilen 176-210) bleibt unverändert, damit der Livechat-Button weiterhin einen Chat ohne Nachrichten öffnen kann.

```typescript
const convs: Conversation[] = contracts
  .filter((c) => map.has(c.id))  // nur Contracts MIT Nachrichten
  .map((c) => {
    const meta = map.get(c.id)!;
    return {
      contract_id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      last_message: meta.last_message,
      last_message_at: meta.last_message_at,
      unread_count: meta.unread_count,
    };
  })
  .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
```

Der bestehende `contractParam`-Fallback (Zeile 187+) sorgt weiterhin dafür, dass ein per URL-Parameter übergebener Contract direkt geladen und angezeigt wird – auch ohne vorherige Nachrichten.

