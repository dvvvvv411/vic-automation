

# Gruener Online-Punkt am Admin-Avatar im Chat-Header

## Was wird gemacht

Im Livechat-Popup-Header wird am Admin-Avatar ein kleiner Statusindikator (Punkt) angezeigt:

- **Gruen** zwischen 08:00 und 18:00 Uhr (deutsche Zeit, Europe/Berlin)
- **Grau** ausserhalb dieser Zeiten

## Umsetzung

### Datei: `src/components/chat/ChatWidget.tsx`

Im Header-Bereich wird der `AvatarUpload`-Bereich mit einem `relative`-Container umschlossen. In diesem Container wird ein kleiner Punkt (`absolute bottom-0 right-0`) platziert, dessen Farbe per Logik bestimmt wird:

```text
const isOnline = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(formatter.format(now), 10);
  return hour >= 8 && hour < 18;
};
```

Der Punkt wird so gestaltet:

```text
<span className={cn(
  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-primary",
  isOnline() ? "bg-green-500" : "bg-gray-400"
)} />
```

### Aenderungen

| Datei | Aenderung |
|---|---|
| `src/components/chat/ChatWidget.tsx` | `isOnline()`-Funktion hinzufuegen + gruenen/grauen Punkt am Avatar im Header rendern |

Keine neuen Abhaengigkeiten noetig -- `Intl.DateTimeFormat` ist nativ im Browser verfuegbar und liefert zuverlaessig die deutsche Zeitzone.

