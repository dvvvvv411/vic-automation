

# Fix: Admin/Kunde Online-Status wird dem Mitarbeiter nicht angezeigt

## Ursache

In `useChatPresence.ts` ist `active` im Dependency-Array des ersten `useEffect` (Zeile 64). Jedes Mal wenn der Mitarbeiter den Chat-Popup öffnet oder schliesst, wird der komplette Presence-Channel abgebaut und neu aufgebaut. Während des Neuaufbaus gehen Sync-Events verloren und der Admin-Status wird nicht rechtzeitig erkannt.

Ausserdem wird der Channel bei jedem `active`-Wechsel komplett neu erstellt (untrack + removeChannel + neuer Channel + subscribe). Das ist unnötig, da der zweite `useEffect` (Zeile 67-87) bereits das Track/Untrack bei `active`-Wechsel übernimmt.

## Lösung

In `src/components/chat/useChatPresence.ts`:

1. **`active` aus dem Dependency-Array des ersten useEffect entfernen** — Channel bleibt dauerhaft bestehen und empfängt Sync-Events kontinuierlich
2. **Track-Logik im ersten useEffect nur initial ausführen** — den `active`-Check in den `subscribe`-Callback behalten, aber mit einem Ref für den aktuellen `active`-Wert arbeiten
3. **Channel nur bei `contractId` oder `role`-Wechsel neu erstellen**

```typescript
// First useEffect: create channel, subscribe, listen for sync
// Dependencies: [contractId, role] — NOT active
useEffect(() => {
  const channel = supabase.channel("chat-presence", {
    config: { presence: { key: role === "user" ? contractId ?? "unknown" : "admin" } },
  });
  channelRef.current = channel;

  channel
    .on("presence", { event: "sync" }, () => {
      // ... same sync logic
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED" && activeRef.current) {
        // ... track
      }
    });

  return () => { channel.untrack(); supabase.removeChannel(channel); };
}, [contractId, role]); // active removed

// Second useEffect: track/untrack when active changes (unchanged)
```

| Datei | Änderung |
|-------|----------|
| `src/components/chat/useChatPresence.ts` | `active` aus deps entfernen, activeRef verwenden |

