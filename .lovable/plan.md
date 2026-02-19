
# Admin-Profil im Livechat auch ohne aktiven Chat bearbeitbar machen

## Problem

Das Admin-Profilbild und der Anzeigename koennen aktuell nur bearbeitet werden, wenn ein Chat ausgewaehlt ist -- das Popover sitzt im Chat-Header, der nur bei aktivem Chat sichtbar ist.

## Loesung

In `src/pages/admin/AdminLivechat.tsx`:

Das Admin-Profil-Popover (Avatar + Anzeigename) wird auch im leeren Zustand (kein Chat ausgewaehlt) angezeigt. Dafuer wird es in den "Kein Chat ausgewaehlt"-Bereich integriert:

- Im leeren Zustand (das `else` von `active ? ...`) wird unter dem "Waehle eine Konversation"-Text das Admin-Profil-Popover angezeigt
- Alternativ: Das Profil-Popover wird aus dem Chat-Header herausgeloest und als festes Element oben rechts positioniert, sodass es **immer** sichtbar ist -- unabhaengig davon ob ein Chat aktiv ist oder nicht

**Bevorzugter Ansatz**: Das Profil-Popover wird in eine eigene Zeile/Header-Leiste verschoben, die immer sichtbar ist. Konkret:

1. Einen permanenten Header-Bereich im rechten Panel erstellen (oberhalb des Chat-Bereichs)
2. Dieser zeigt rechts das Admin-Profil-Popover (Avatar + Name-Bearbeitung)
3. Wenn ein Chat aktiv ist, zeigt der Header zusaetzlich links die Mitarbeiter-Infos und SMS-Buttons
4. Wenn kein Chat aktiv ist, zeigt der Header nur das Admin-Profil rechts

| Datei | Aenderung |
|-------|----------|
| `src/pages/admin/AdminLivechat.tsx` | Header-Bereich mit Admin-Profil-Popover aus dem bedingten Block herausloesen und immer anzeigen |
