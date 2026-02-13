

# Fix: Nach Seitenneuladen immer zur neuesten Nachricht scrollen

## Problem

Beim Neuladen der Seite wird nicht automatisch nach unten gescrollt. Die bestehenden `useEffect`-Hooks fuer Auto-Scroll reagieren zwar auf Aenderungen an `messages`, aber beim initialen Laden kann es passieren, dass der Scroll ausgefuehrt wird bevor die Nachrichten im DOM gerendert sind (z.B. waehrend `loading` noch `true` ist).

## Loesung

In beiden Dateien den Auto-Scroll `useEffect` so anpassen, dass er auch auf den `loading`-State reagiert -- konkret: wenn `loading` von `true` auf `false` wechselt und Nachrichten vorhanden sind, wird nach unten gescrollt. Zusaetzlich ein kleines `setTimeout` einbauen, damit der Browser den DOM-Update abschliessen kann bevor gescrollt wird.

## Aenderungen

| Datei | Aenderung |
|---|---|
| `src/components/chat/ChatWidget.tsx` | Auto-Scroll useEffect: `loading` als Dependency hinzufuegen + `setTimeout` fuer zuverlaessiges Scrollen nach Render |
| `src/pages/admin/AdminLivechat.tsx` | Gleiche Anpassung: `loading` als Dependency + `setTimeout` |

### Detaillierte Aenderung

Beide Dateien haben aktuell diesen Auto-Scroll Code:

```text
useEffect(() => {
  if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
}, [messages, isTyping]);
```

Wird geaendert zu:

```text
useEffect(() => {
  if (scrollRef.current) {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }
}, [messages, loading, isTyping]);
```

Durch die Ergaenzung von `loading` in den Dependencies wird der Scroll auch ausgeloest wenn die Nachrichten nach dem initialen Laden erscheinen. Das `setTimeout(50ms)` stellt sicher, dass der Browser den DOM-Render abgeschlossen hat bevor gescrollt wird.

In `AdminLivechat.tsx` hat der useEffect auch `draftPreview` als Dependency -- das bleibt erhalten.

