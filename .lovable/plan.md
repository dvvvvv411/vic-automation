
# Livechat Fullscreen auf Mobile

## Aenderung

Auf Mobile (< 768px) wird das Chat-Popup als Fullscreen-Overlay angezeigt statt als kleines Popup. Die Desktop-Ansicht bleibt komplett unveraendert.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/components/chat/ChatWidget.tsx` | `useIsMobile` Hook importieren. Responsive Klassen auf den Container und das Chat-Fenster anwenden. |

## Details

### Container (`div` mit `fixed bottom-6 right-6`)
- Mobile: `fixed inset-0` (gesamter Bildschirm) statt `bottom-6 right-6`
- Desktop: unveraendert `fixed bottom-6 right-6`

### Chat-Fenster (`motion.div`)
- Mobile: `fixed inset-0 w-full h-full rounded-none` -- Fullscreen ohne Abrundung, nicht mehr absolut positioniert
- Desktop: unveraendert `absolute bottom-16 right-0 w-[380px] h-[520px] rounded-2xl`

### FAB-Button
- Mobile bei geoeffnetem Chat: versteckt (`hidden`), da der Close-Button im Header genuegt
- Desktop: unveraendert, immer sichtbar

### Konkrete Klassen-Aenderungen

```text
// Container
<div className={cn(
  "fixed z-50",
  isMobile && open ? "inset-0" : "bottom-6 right-6"
)}>

// Chat-Fenster
<motion.div className={cn(
  "bg-card shadow-2xl border border-border flex flex-col overflow-hidden",
  isMobile
    ? "fixed inset-0 w-full h-full rounded-none"
    : "absolute bottom-16 right-0 w-[380px] h-[520px] rounded-2xl"
)}>

// FAB
{!(isMobile && open) && (
  <button ...>FAB</button>
)}
```

Die gesamte Logik (Nachrichten, Scroll, Sounds, Typing) bleibt identisch -- nur das Layout aendert sich auf Mobile.
