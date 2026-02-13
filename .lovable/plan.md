

# Fix: Typing-Animation sofort nach Absenden ausblenden

## Problem

Wenn eine Nachricht abgeschickt wird, sendet der Absender ein letztes Broadcast-Event mit leerem Text (`sendTyping("")`). Der Empfaenger behandelt aber **jedes** Broadcast-Event als "tippt gerade" (`setIsTyping(true)`) und wartet dann 3 Sekunden auf den Timeout. Deshalb bleibt die Tipp-Animation noch 3 Sekunden sichtbar, obwohl die Nachricht bereits gesendet wurde.

## Loesung

In `useChatTyping.ts` eine Pruefung einbauen: Wenn der empfangene `draft`-Text leer ist (oder nicht vorhanden), sofort `isTyping = false` und `draftPreview = null` setzen statt den 3-Sekunden-Timeout zu starten.

## Aenderung

| Datei | Aenderung |
|---|---|
| `src/components/chat/useChatTyping.ts` | Broadcast-Handler: bei leerem Draft sofort `isTyping(false)` setzen statt Timeout |

### Detaillierte Aenderung

Im Broadcast-Handler (Zeile 23-37) wird vor dem `setIsTyping(true)` geprueft ob der Draft leer ist:

```
// Vorher: Jedes Event setzt isTyping=true + 3s Timeout
setIsTyping(true);
clearTimeout(typingTimeout.current);
typingTimeout.current = setTimeout(() => { ... }, 3000);

// Nachher: Leerer Draft = sofort aufhoeren
const draft = data.draft;
const hasContent = draft && draft.trim().length > 0;

if (!hasContent) {
  setIsTyping(false);
  setDraftPreview(null);
  clearTimeout(typingTimeout.current);
  return;
}

setIsTyping(true);
if (role === "admin") setDraftPreview(draft);
clearTimeout(typingTimeout.current);
typingTimeout.current = setTimeout(() => {
  setIsTyping(false);
  setDraftPreview(null);
}, 3000);
```

Der 3-Sekunden-Timeout bleibt als Fallback fuer den Fall, dass der Nutzer einfach aufhoert zu tippen ohne abzuschicken.

