

## Plan: Chat-Widget auffaelliger machen + Browser Push Notifications

### 1. FAB mit Label "Chatte jetzt mit uns"

In `ChatWidget.tsx` den FAB-Button (Zeile 441-457) erweitern:
- Statt nur ein rundes Icon wird ein Pill-Button mit Text "Chatte jetzt mit uns" + MessageCircle-Icon angezeigt (wenn Chat geschlossen)
- Leichte Eingangsanimation (slide-in von rechts)
- Unread-Badge bleibt erhalten

### 2. Browser Push Notifications

In `ChatWidget.tsx` bei `onNewMessage` (Zeile 73-83):
- Beim ersten Oeffnen des Chats `Notification.requestPermission()` aufrufen
- Bei neuer Admin-Nachricht, wenn Tab nicht sichtbar (`document.hidden`), eine `new Notification(...)` mit Titel "Neue Nachricht" und Nachrichtenvorschau anzeigen
- Klick auf Notification fokussiert das Fenster und oeffnet den Chat

### 3. Sound bleibt wie bisher
`playNotification()` wird bereits aufgerufen — keine Aenderung noetig.

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/components/chat/ChatWidget.tsx` | FAB zu Pill mit Label, Notification.requestPermission + native Push bei neuen Nachrichten |

