
# Fix: Livechat-Layout fixieren bei langen Nachrichten

## Problem

Wenn ein Nutzer eine sehr lange Nachricht schickt (besonders mit langen Woertern ohne Leerzeichen), kann die Chat-Bubble breiter werden als der Container, wodurch das gesamte Layout wachst und man rauszoomen muss.

## Ursache

1. Die Chat-Area (`flex-1 flex flex-col min-w-0`) hat kein `overflow-hidden`, sodass ueberlange Inhalte den Container ausdehnen koennen
2. In `ChatBubble.tsx` nutzt die Nachricht `break-words`, aber fuer extrem lange Strings ohne Leerzeichen reicht das nicht -- es braucht zusaetzlich `overflow-wrap: anywhere` bzw. die Tailwind-Klasse `break-all` als Fallback

## Loesung

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminLivechat.tsx` | Chat-Area Container: `overflow-hidden` hinzufuegen damit nichts ueber den Rand hinauswachsen kann |
| `src/components/chat/ChatBubble.tsx` | Nachrichten-Paragraph: `break-all` als zusaetzlichen Fallback hinzufuegen und `overflow-hidden` auf der Bubble-Div |

### Detaillierte Aenderungen

**AdminLivechat.tsx, Zeile 179:**
```
// Vorher
<div className="flex-1 flex flex-col min-w-0">

// Nachher
<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
```

**ChatBubble.tsx, Zeile 24-31:**
```
// Vorher
<div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm", ...)}>

// Nachher
<div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden", ...)}>
```

**ChatBubble.tsx, Zeile 32:**
```
// Vorher
<p className="whitespace-pre-wrap break-words">{content}</p>

// Nachher
<p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{content}</p>
```

`overflow-wrap: anywhere` ist staerker als `break-words` und bricht auch extrem lange Strings (z.B. URLs) um. Die Kombination mit `overflow-hidden` auf dem Container und der Chat-Area stellt sicher, dass das Layout fixiert bleibt.
