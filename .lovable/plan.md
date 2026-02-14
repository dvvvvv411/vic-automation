

# Fix: Beim Oeffnen des Livechat-Popups zur neuesten Nachricht scrollen

## Problem

Der Auto-Scroll `useEffect` in `ChatWidget.tsx` reagiert auf `messages`, `loading` und `isTyping` -- aber nicht auf `open`. Wenn der Nutzer das Chat-Popup oeffnet, sind die Nachrichten bereits geladen (kein Wechsel bei `messages` oder `loading`), daher wird der Scroll nicht ausgeloest.

## Loesung

`open` als Dependency zum Auto-Scroll `useEffect` hinzufuegen.

## Aenderung

| Datei | Aenderung |
|---|---|
| `src/components/chat/ChatWidget.tsx` | `open` zur Dependency-Liste des Auto-Scroll useEffect hinzufuegen |

### Detail

Zeile 93 aendern:

```
// Vorher
}, [messages, loading, isTyping]);

// Nachher
}, [messages, loading, isTyping, open]);
```

Damit wird jedes Mal wenn das Popup geoeffnet wird (`open` wechselt auf `true`) automatisch nach unten gescrollt.

