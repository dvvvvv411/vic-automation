

# Livechat-Nachrichten werden nicht angezeigt

## Problem

Die Konversation mit Yvonne Reiter hat 52 Nachrichten, aber der Chat laedt nur die **ersten 50** (aeltesten). Dadurch werden die 2 neuesten Nachrichten nicht angezeigt. Dieses Problem betrifft jede Konversation, die mehr als 50 Nachrichten hat.

## Loesung

Das Nachrichten-Limit in `useChatRealtime.ts` wird deutlich erhoeht und die Sortierung beibehalten. Zusaetzlich wird sichergestellt, dass bei langen Konversationen immer die neuesten Nachrichten sichtbar sind.

## Aenderung

**Datei: `src/components/chat/useChatRealtime.ts`**

- Zeile 37: `.limit(50)` aendern zu `.limit(200)`

Das ist die einfachste und sicherste Loesung. 200 Nachrichten decken auch laengere Konversationen ab, ohne die Performance zu beeintraechtigen (Chat-Nachrichten sind kleine Datensaetze).

### Alternative (optional, spaeter)

Falls Konversationen irgendwann ueber 200 Nachrichten hinausgehen, koennte eine "Aeltere Nachrichten laden"-Funktion mit Pagination implementiert werden. Fuer den aktuellen Anwendungsfall reicht die Erhoehung des Limits aus.

Eine einzelne Zeile wird geaendert – keine neuen Dateien oder Abhaengigkeiten.
