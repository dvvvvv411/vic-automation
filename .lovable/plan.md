

## Plan: Lesebestätigung für Admin-Nachrichten im Livechat

### Problem

Admins sehen aktuell nicht, ob der Mitarbeiter ihre Nachricht gelesen hat. Die `chat_messages`-Tabelle hat ein `read`-Boolean, aber kein `read_at`-Timestamp.

### Änderungen

#### 1. SQL-Migration: `read_at` Spalte hinzufügen

```sql
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at timestamptz DEFAULT NULL;
```

#### 2. ChatWidget: `read_at` beim Lesen setzen

In `src/components/chat/ChatWidget.tsx` — überall wo `.update({ read: true })` steht, zusätzlich `read_at: new Date().toISOString()` setzen. Betrifft:
- Zeile 101: Einzelnachricht beim Empfang im offenen Chat
- Zeile 220: Bulk-Mark beim Öffnen des Chats

#### 3. ChatBubble: Lesebestätigung anzeigen

In `src/components/chat/ChatBubble.tsx`:
- Neue Props: `read?: boolean`, `readAt?: string | null`
- Bei `isOwnMessage`-Bubbles: Neben dem Zeitstempel ein Doppel-Häkchen (✓✓) in Blau anzeigen wenn gelesen, einfaches Häkchen (✓) in Grau wenn nicht gelesen
- Bei gelesen: Tooltip oder kleiner Text mit `read_at`-Timestamp (z.B. "Gelesen um 14:32")

#### 4. AdminLivechat: Props durchreichen

In `src/pages/admin/AdminLivechat.tsx` (Zeile 506): `read` und `readAt` Props an `ChatBubble` weitergeben, aber nur für Admin-Nachrichten (`sender_role === "admin"`).

Die `useChatRealtime`-Hook liefert bereits alle Felder via `SELECT *`, also wird `read_at` automatisch mit geladen und bei Realtime-UPDATEs aktualisiert.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| Neue SQL-Migration | `read_at` timestamptz Spalte |
| `src/components/chat/ChatWidget.tsx` | `read_at` beim Lesen setzen |
| `src/components/chat/ChatBubble.tsx` | `read`/`readAt` Props + Häkchen-Anzeige |
| `src/pages/admin/AdminLivechat.tsx` | Props an ChatBubble durchreichen |

