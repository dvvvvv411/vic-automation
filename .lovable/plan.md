

# Fix: Chat soll direkt bei der neuesten Nachricht starten (kein sichtbares Scrollen)

## Problem

Aktuell wird per `setTimeout` nach unten gescrollt -- das passiert *nachdem* das Popup bereits sichtbar ist, wodurch man den Scroll-Vorgang sieht. Der Chat soll aber sofort bei der neuesten Nachricht starten, ohne jegliche sichtbare Scroll-Bewegung.

## Loesung

Statt `setTimeout` wird ein CSS-Trick verwendet: `flex-direction: column-reverse` auf dem Nachrichten-Container. Damit beginnt der Container automatisch am Ende (unten) -- ganz ohne JavaScript-Scrolling. Zusaetzlich werden die beiden scroll-useEffects entfernt bzw. vereinfacht.

**Alternativ** (einfacher und zuverlaessiger): Den `onAnimationComplete`-Callback von Framer Motion nutzen, um den Scroll *vor* dem ersten sichtbaren Frame zu setzen -- aber `column-reverse` ist die sauberste Loesung.

**Gewaehlt: Ansatz mit `onAnimationStart`** -- Scroll wird gesetzt bevor die Animation startet, sodass der Nutzer nie den Scroll sieht.

| Datei | Aenderung |
|---|---|
| `src/components/chat/ChatWidget.tsx` | Oeffnungs-useEffect entfernen, stattdessen Scroll sofort beim Rendern setzen via `useLayoutEffect` |

### Detail

1. **Import aendern**: `useLayoutEffect` aus React importieren

2. **Oeffnungs-useEffect (Zeile 95-104) ersetzen** durch einen `useLayoutEffect`:
```text
// Beim Oeffnen sofort ganz unten starten (vor dem Paint)
useLayoutEffect(() => {
  if (open && scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [open, messages, loading]);
```

3. **Allgemeinen Auto-Scroll useEffect (Zeile 84-93) beibehalten** -- der bleibt fuer neue Nachrichten waehrend der Chat offen ist.

`useLayoutEffect` laeuft synchron *vor* dem Browser-Paint. Dadurch ist der Scroll bereits gesetzt bevor der Nutzer irgendetwas sieht -- kein Flackern, kein sichtbares Scrollen. Der Chat startet einfach direkt bei der neuesten Nachricht.

