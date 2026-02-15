

# Onlinezeit auf 19:00 verlaengern

## Aenderung

In `src/components/chat/ChatWidget.tsx` wird in der `isOnline()`-Funktion die Bedingung `hour < 18` auf `hour < 19` geaendert, sodass der gruene Status-Punkt bis 19:00 Uhr Berliner Zeit aktiv bleibt.

## Technische Umsetzung

**Datei**: `src/components/chat/ChatWidget.tsx`, Zeile 29

Vorher: `return hour >= 8 && hour < 18;`
Nachher: `return hour >= 8 && hour < 19;`

