

# Fix: Mitarbeiter Online-Status im Admin-Livechat

## Problem

Supabase Presence ist unzuverlässig für die Anzeige des Mitarbeiter-Online-Status. Presence-Events werden nur transient über WebSocket synchronisiert und gehen verloren bei Timing-Problemen, Tab-Wechsel oder wenn die Verbindungen nicht exakt gleichzeitig bestehen.

## Lösung: DB-basierter Heartbeat

Statt Presence verwenden wir einen DB-basierten Ansatz wie beim Admin-Online-Status:

### 1. Migration: `chat_active_at` Spalte auf `employment_contracts`

```sql
ALTER TABLE public.employment_contracts
ADD COLUMN chat_active_at timestamptz DEFAULT NULL;
```

Employee gilt als "online" wenn `chat_active_at` weniger als 2 Minuten alt ist.

### 2. `ChatWidget.tsx` anpassen

Wenn der Chat geöffnet ist (`open === true`), sofort und dann alle 30 Sekunden `chat_active_at = now()` auf den Contract updaten. Beim Schließen auf `NULL` setzen.

### 3. `AdminLivechat.tsx` anpassen

- Beim Laden der Conversations auch `chat_active_at` aus `employment_contracts` lesen
- Online-Status berechnen: `chat_active_at && (now - chat_active_at) < 2 min`
- Realtime-Subscription auf `employment_contracts` UPDATE Events, um `chat_active_at` Änderungen live zu empfangen
- `onlineContractIds` Set lokal aus diesen Daten berechnen statt aus Presence

### 4. Presence-Hook Aufräumen

- `useChatPresence` Import und Aufruf aus `AdminLivechat.tsx` entfernen (für Employee-Status nicht mehr benötigt)
- `useChatPresence` in `ChatWidget.tsx` kann bleiben für Admin-Online-Anzeige (oder auch entfernt werden, da Admin-Status jetzt DB-basiert ist)

| Datei | Änderung |
|-------|----------|
| Migration (SQL) | `chat_active_at` Spalte auf `employment_contracts` |
| `src/components/chat/ChatWidget.tsx` | Heartbeat: alle 30s `chat_active_at` updaten wenn Chat offen |
| `src/pages/admin/AdminLivechat.tsx` | Online-Status aus DB lesen statt Presence, Realtime-Subscription für Updates |

