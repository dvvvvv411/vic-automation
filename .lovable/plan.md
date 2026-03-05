

# Online-Status im Admin-Livechat

## Uebersicht

Im Admin-Livechat soll in der Konversationsliste ein gruener Punkt angezeigt werden, wenn ein Mitarbeiter gerade aktiv den Chat geoeffnet hat. Dafuer wird Supabase Realtime Presence verwendet.

## Aenderungen

### 1. Neuer Hook: `src/components/chat/useChatPresence.ts`

Zentraler Hook fuer Presence-Management:
- Nutzt `supabase.channel("chat-presence")` mit `.track()` um den eigenen Status zu senden
- Parameter: `contractId`, `role` ("user" oder "admin")
- User-Seite: Tracked Presence wenn ChatWidget geoeffnet ist, untracked wenn geschlossen
- Admin-Seite: Subscribed auf Presence-State und gibt ein Set der aktuell online contract_ids zurueck

### 2. `src/components/chat/ChatWidget.tsx`

- Importiert `useChatPresence`
- Wenn `open === true`: tracked Presence mit `{ contract_id, role: "user" }`
- Wenn `open === false` oder Unmount: untracked Presence

### 3. `src/components/chat/ConversationList.tsx`

- Neues Prop: `onlineContractIds: Set<string>`
- Zeigt einen gruenen Punkt neben dem Namen, wenn die `contract_id` im Set enthalten ist
- Text "Online" oder "Offline" als kleiner Hinweis unter dem Namen

### 4. `src/pages/admin/AdminLivechat.tsx`

- Importiert `useChatPresence` mit `role: "admin"`
- Gibt das `onlineContractIds` Set an `ConversationList` weiter

## Technische Details

- Supabase Realtime Presence erfordert keinen DB-Zugriff -- es laeuft komplett ueber WebSockets
- Kein neues Datenbankschema noetig
- Presence-State wird automatisch bereinigt wenn der Client disconnected (Tab schliessen, Navigation weg)
- Ein einzelner Channel `chat-presence` wird geteilt, sodass der Admin alle Online-User auf einmal sieht

