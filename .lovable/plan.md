

# Livechat öffnen auch ohne bestehende Nachrichten

## Problem
Wenn man auf der Mitarbeiter-Detailseite den "Livechat"-Button klickt, navigiert man zu `/admin/livechat?contract=...`. Dort wird der Contract aber nur angezeigt, wenn bereits Chat-Nachrichten existieren (Zeile 150 filtert: `contracts.filter(c => map.has(c.id))`). Ohne Nachrichten passiert nichts.

## Lösung

**Datei: `src/pages/admin/AdminLivechat.tsx`**

1. **Conversations-Liste erweitern** (Zeile 149-152): Contracts ohne Nachrichten ebenfalls in die Liste aufnehmen, mit leeren Default-Werten (`last_message: ""`, `last_message_at: created_at`, `unread_count: 0`). Sie werden am Ende der Liste sortiert.

2. **Auto-Select erweitern** (Zeile 161-170): Wenn der `contract`-Parameter gesetzt ist aber kein Match in `conversations` gefunden wird, den Contract direkt aus der DB laden und als temporäre Conversation erstellen, damit der Chat sofort geöffnet wird. So kann der Admin direkt schreiben.

Konkret:
- Zeile 149-152: Statt `.filter((c) => map.has(c.id))` alle Contracts mappen, wobei für Contracts ohne Nachrichten Default-Werte verwendet werden
- Zeile 161-170: Falls nach dem Laden der Conversations kein Match gefunden wird, den Contract per Query nachladen und als aktive Conversation setzen

