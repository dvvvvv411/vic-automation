
# Datumstrenner im Chatverlauf

## Was wird gemacht

Zwischen Nachrichten verschiedener Tage wird ein dezenter Datumstrenner angezeigt -- eine horizontale Linie mit dem Datum in der Mitte (wie bei WhatsApp/Telegram). So sieht man sofort, an welchem Tag welche Nachrichten geschrieben wurden.

## Umsetzung

### 1. Neue Komponente `DateSeparator` in `ChatBubble.tsx`

Eine einfache Komponente, die das Datum zentriert zwischen zwei feinen Linien anzeigt:

```text
——————— 12. Februar 2026 ———————
```

- Styling: `text-xs text-muted-foreground` mit Linien links und rechts (`border-t`)
- Datumsformat: `dd. MMMM yyyy` (deutsch, z.B. "14. Februar 2026")
- Fuer heute: "Heute", fuer gestern: "Gestern"

### 2. Rendering-Logik in `AdminLivechat.tsx` und `ChatWidget.tsx`

In beiden Dateien wird beim Rendern der Nachrichten-Liste geprueft: Hat die aktuelle Nachricht ein anderes Datum als die vorherige? Falls ja, wird vor der Nachricht ein `DateSeparator` eingefuegt.

```text
messages.map((msg, i) => {
  const showDate = i === 0 || !isSameDay(new Date(msg.created_at), new Date(messages[i-1].created_at));
  return (
    <>
      {showDate && <DateSeparator date={msg.created_at} />}
      <ChatBubble ... />
    </>
  );
})
```

## Dateien

| Datei | Aenderung |
|---|---|
| `src/components/chat/ChatBubble.tsx` | Neue `DateSeparator`-Komponente exportieren |
| `src/pages/admin/AdminLivechat.tsx` | `DateSeparator` vor Nachrichten mit neuem Datum rendern |
| `src/components/chat/ChatWidget.tsx` | Gleiche Logik fuer das Mitarbeiter-Widget |

## Technische Details

- `date-fns` ist bereits installiert -- `isSameDay`, `isToday`, `isYesterday` und `format` werden verwendet
- Kein zusaetzlicher State noetig, die Logik laeuft rein beim Rendern ueber den Nachrichten-Index
