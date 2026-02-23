

# Emoji-Picker im Chat-Eingabefeld

## Uebersicht

Ein Emoji-Button wird im Eingabebereich des Livechats hinzugefuegt (zwischen Anhang-Button und Textarea). Beim Klick oeffnet sich ein Popover mit einer durchsuchbaren Emoji-Auswahl. Funktioniert fuer Admin und Mitarbeiter gleichermassen, da beide die gleiche `ChatInput`-Komponente nutzen.

## Technischer Ansatz

Statt einer externen Library wird eine eigene, leichtgewichtige Emoji-Auswahl gebaut, die die nativen Unicode-Emojis des Betriebssystems nutzt. Die Emojis werden in Kategorien gruppiert (Smileys, Gesten, Herzen, Tiere, Essen, Reisen, Objekte, Symbole) und sind per Suchfeld filterbar.

## Aenderungen

### 1. Neue Komponente: `src/components/chat/EmojiPicker.tsx`

- Nutzt `Popover` + `PopoverTrigger` + `PopoverContent` aus `@/components/ui/popover`
- Smiley-Icon (`Smile` aus lucide-react) als Trigger-Button
- Suchfeld oben im Popover zum Filtern
- Kategorien als Tabs oder Abschnitte (Smileys, Gesten, Herzen, Tiere, Essen, Reisen, Objekte, Symbole)
- Jedes Emoji ist ein Button, der beim Klick `onSelect(emoji)` aufruft
- Statische Emoji-Liste als konstantes Array mit Unicode-Zeichen und Suchbegriffen
- ScrollArea fuer die Emoji-Liste

### 2. Aenderung: `src/components/chat/ChatInput.tsx`

- Import der neuen `EmojiPicker`-Komponente
- Emoji-Picker zwischen Anhang-Button und Textarea platzieren
- `onSelect`-Handler: Fuegt das gewaehlte Emoji an der aktuellen Cursor-Position im Textarea ein (oder am Ende)
- Textarea-Ref hinzufuegen um Cursor-Position zu tracken

### Layout der Eingabezeile

```text
[+Anhang] [Emoji] [____Textarea____] [Senden]
```

### Emoji-Daten (Auszug der Kategorien)

- Smileys: 😀😃😄😁😆🥹😅🤣😂🙂😊😇🥰😍🤩😘😗😚😙🥲😋😛😜🤪😝...
- Gesten: 👍👎👋🤚✋🖐🏻🤏✌🏻🤞🤟🤘🤙👈👉👆👇☝🏻👏🤝🙏...
- Herzen: ❤🧡💛💚💙💜🖤🤍🤎💔❤‍🔥💕💞💓💗💖💘💝...
- Tiere: 🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵...
- Essen: 🍏🍎🍐🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍...
- Reisen: 🚗🚕🚙🚌🚎🏎🚓🚑🚒✈🚀🚁⛵🚢🏠...
- Objekte: 📱💻⌨🖥🖨📷📹🎥📺📻⏰💡🔋🔌...
- Symbole: ❗❓❕❔‼⁉💯🔥⭐💫✨🎉🎊...

Ca. 200-300 der gaengigsten Emojis, gruppiert und mit deutschen Suchbegriffen versehen.

## Keine Datenbank-Aenderungen

Emojis sind einfache Unicode-Zeichen im Nachrichtentext -- es sind keine Backend-Aenderungen noetig.

