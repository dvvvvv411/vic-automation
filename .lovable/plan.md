

# Admin Online/Offline Toggle im Livechat

## Uebersicht

Der Admin kann sich im Profil-Popover manuell als Online oder Offline markieren. Die zeitbasierte `isOnline()`-Funktion im ChatWidget wird entfernt und durch den echten Presence-Status des Admins ersetzt.

## Aenderungen

### 1. `src/components/chat/useChatPresence.ts`

- Admin tracked jetzt auch Presence wenn `active === true`: `.track({ role: "admin" })`
- Wenn `active === false`: `.untrack()`
- Neues Feld im Return: `adminOnline: boolean` -- prueft ob ein Admin im Presence-State ist

### 2. `src/pages/admin/AdminLivechat.tsx`

- Neuer State: `adminOnlineStatus` (boolean, default `true`)
- Im Profil-Popover (nach Anzeigename): Switch-Toggle "Online-Status" mit Label
- `useChatPresence` erhaelt `active: adminOnlineStatus` und `role: "admin"`
- Import von `Switch` aus `@/components/ui/switch`

### 3. `src/components/chat/ChatWidget.tsx`

- `isOnline()`-Funktion komplett entfernen
- `useChatPresence` gibt jetzt `adminOnline` zurueck
- Der gruene/graue Punkt im Chat-Header nutzt `adminOnline` statt `isOnline()`

### Zusammenfassung

| Datei | Aenderung |
|---|---|
| `useChatPresence.ts` | Admin-Tracking + `adminOnline` im Return |
| `AdminLivechat.tsx` | Toggle im Profil-Popover |
| `ChatWidget.tsx` | `isOnline()` entfernen, `adminOnline` nutzen |

