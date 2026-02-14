
# Fix: Flackern beim Oeffnen des Chat-Popups beseitigen

## Problem

Der Auto-Scroll `useEffect` feuert bei jeder Aenderung von `open` -- also auch beim Schliessen. Ausserdem kollidiert der 50ms-Timeout mit der Framer-Motion-Oeffnungsanimation, was zu sichtbarem Flackern fuehrt.

## Loesung

Den Scroll-Trigger fuer `open` vom allgemeinen Auto-Scroll trennen:

1. **Separater useEffect nur fuers Oeffnen**: Reagiert nur auf `open`, prueft ob `open === true`, und scrollt dann mit einem laengeren Delay (150ms) damit die Animation abgeschlossen ist.
2. **Allgemeiner Auto-Scroll bleibt wie vorher**: Nur fuer `messages`, `loading`, `isTyping` -- ohne `open`.

## Aenderung

| Datei | Aenderung |
|---|---|
| `src/components/chat/ChatWidget.tsx` | `open` aus dem bestehenden useEffect entfernen, separaten useEffect hinzufuegen |

### Detail

**Bestehenden useEffect (Zeile 85-93) aendern:**

```text
// Auto-scroll bei neuen Nachrichten
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

**Neuen useEffect direkt danach einfuegen:**

```text
// Beim Oeffnen smooth nach unten scrollen
useEffect(() => {
  if (open && scrollRef.current) {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 150);
  }
}, [open]);
```

Der laengere Delay von 150ms gibt der Framer-Motion-Animation (spring mit damping 25, stiffness 350) genug Zeit sich zu entfalten, bevor gescrollt wird. Und weil der Effect nur bei `open === true` scrollt, passiert beim Schliessen nichts.
