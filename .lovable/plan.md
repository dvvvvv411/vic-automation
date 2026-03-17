

## Plan: Zeitbasierter Online-Status fuer Livechat

### Ansatz

Statt eines manuellen Toggles (`chat_online` boolean) wird der Online-Status ueber feste Uhrzeiten gesteuert. Zwei neue Spalten `chat_online_from` und `chat_online_until` (time) auf `brandings`. Der Status wird clientseitig berechnet: online wenn aktuelle Uhrzeit zwischen `from` und `until` liegt. Default: 08:00-17:00.

### Aenderungen

**1. DB-Migration**

```sql
ALTER TABLE public.brandings
ADD COLUMN chat_online_from time NOT NULL DEFAULT '08:00',
ADD COLUMN chat_online_until time NOT NULL DEFAULT '17:00';
```

Die bestehende `chat_online` Spalte bleibt vorerst bestehen (Abwaertskompatibilitaet), wird aber nicht mehr beschrieben.

**2. `src/pages/admin/AdminLivechatEinstellungen.tsx`**

- Entferne den Switch-Toggle fuer Online-Status
- Ersetze durch zwei Zeit-Selects (Startzeit / Endzeit) mit Stunden-Optionen (00:00-23:00)
- Lade `chat_online_from` und `chat_online_until` aus Branding
- Speichere die Zeiten beim Klick auf "Speichern"
- Zeige aktuelle Status-Vorschau: gruener/grauer Punkt + "Aktuell online/offline" basierend auf der aktuellen Uhrzeit

**3. `src/components/chat/ChatWidget.tsx`**

- Statt `chat_online` boolean direkt zu nutzen, lese `chat_online_from` und `chat_online_until`
- Berechne clientseitig ob aktuell online: `currentTime >= from && currentTime < until`
- Realtime-Subscription aktualisiert die Zeiten bei Aenderung
- Optional: `setInterval` alle 60s um den Status bei Stundenwechsel zu aktualisieren

**4. `src/pages/admin/AdminLivechat.tsx`**

- Gleiche Anpassung: Lese `chat_online_from`/`chat_online_until` statt `chat_online` und berechne Status clientseitig

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | `chat_online_from` + `chat_online_until` Spalten |
| `AdminLivechatEinstellungen.tsx` | Toggle → Zeit-Selects |
| `ChatWidget.tsx` | Zeitbasierte Online-Berechnung |
| `AdminLivechat.tsx` | Zeitbasierte Online-Berechnung |

