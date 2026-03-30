

## Plan: Realtime fuer chat_messages fixen (REPLICA IDENTITY FULL)

### Problem
Supabase Realtime mit aktiviertem RLS erfordert `REPLICA IDENTITY FULL` auf der Tabelle, damit Realtime die RLS-Policies gegen die neuen Zeilen evaluieren kann. Ohne das werden Events stillschweigend verworfen — deshalb kommen keine Live-Updates und man muss die Seite refreshen.

### Loesung

**SQL-Migration:**

```sql
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.employment_contracts REPLICA IDENTITY FULL;
```

Beide Tabellen brauchen es:
- `chat_messages` — fuer neue Nachrichten im Chat (useChatRealtime + Konversationsliste)
- `employment_contracts` — fuer den Online-Status-Heartbeat (chat_active_at Updates)

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/migrations/[new].sql` | `REPLICA IDENTITY FULL` auf beiden Tabellen |

Kein Frontend-Code-Change noetig. Die Subscriptions sind bereits korrekt implementiert.

