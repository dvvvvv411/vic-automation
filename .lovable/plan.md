
# Systemnachrichten als ungelesene Nachrichten zaehlen

## Problem

Im `ChatWidget` werden ungelesene Nachrichten nur gezaehlt wenn `sender_role === "admin"`. Systemnachrichten (z.B. Terminbuchungen) werden komplett ignoriert -- kein Badge, keine Benachrichtigung.

## Loesung

An drei Stellen in `ChatWidget.tsx` wird die Bedingung von `sender_role === "admin"` auf `sender_role !== "user"` geaendert, damit sowohl Admin- als auch Systemnachrichten als ungelesen zaehlen:

**Datei**: `src/components/chat/ChatWidget.tsx`

1. **Realtime-Callback** (Zeile 45): `msg.sender_role === "admin"` wird zu `msg.sender_role !== "user"` -- damit loesen auch Systemnachrichten den Badge und den Benachrichtigungston aus

2. **Unread-Count beim Laden** (Zeile 123): Der Filter `.eq("sender_role", "admin")` wird zu `.in("sender_role", ["admin", "system"])` -- damit werden auch bestehende ungelesene Systemnachrichten gezaehlt

3. **Mark-as-read beim Oeffnen** (Zeile 135): Der Filter `.eq("sender_role", "admin")` wird zu `.in("sender_role", ["admin", "system"])` -- damit werden beim Oeffnen des Chats auch Systemnachrichten als gelesen markiert
