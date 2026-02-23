

# Auftragstermine blockieren im Zeitplan

## Uebersicht

Eine neue Sektion auf `/admin/zeitplan` zum Blockieren einzelner Auftragstermin-Slots (analog zur bestehenden Bewerbungsgespraech-Blockierung). Mitarbeiter sehen blockierte Slots dann nicht mehr als verfuegbar.

## 1. Neue Datenbanktabelle

Migration erstellt `order_appointment_blocked_slots` mit derselben Struktur wie `schedule_blocked_slots`:

- `id` (uuid, PK)
- `blocked_date` (date, NOT NULL)
- `blocked_time` (time, NOT NULL)
- `reason` (text, optional)
- `created_at` (timestamptz, default now())

RLS-Policies:
- Admins: voller Zugriff (ALL)
- Authentifizierte Nutzer: Lesezugriff (SELECT) -- damit Mitarbeiter blockierte Slots pruefen koennen

## 2. Neue Sektion in `src/pages/admin/AdminZeitplan.tsx`

Unterhalb der bestehenden Bewerbungsgespraech-Blockierung wird eine zweite Card-Sektion hinzugefuegt mit Titel "Auftragstermine blockieren". Die Logik ist identisch:

- Eigener Kalender + Datums-Auswahl
- Zeitslots-Grid (08:00-17:30 in 30-Min-Schritten, passend zu den Auftrags-Slots)
- Optionaler Grund
- Eigene Query (`order-appointment-blocked-slots`) und eigene Mutations (insert/delete auf `order_appointment_blocked_slots`)
- Eigene Liste aller blockierten Auftragstermin-Slots am Ende

Beide Sektionen (Bewerbung + Auftrag) bleiben unabhaengig voneinander.

## 3. Mitarbeiter-Seite: Blockierte Slots ausblenden

In `src/pages/mitarbeiter/AuftragDetails.tsx`:
- Beim Laden der Seite die blockierten Slots fuer das gewaehlte Datum aus `order_appointment_blocked_slots` abfragen
- Im `availableTimeSlots`-Memo blockierte Zeiten herausfiltern, sodass Mitarbeiter nur freie Slots sehen

## Technische Details

```text
Seitenaufbau /admin/zeitplan (nach Aenderung):

[Allgemeine Zeiteinstellungen]          (bestehend)
[Bewerbungsgespraech-Zeiten blockieren] (bestehend)
[Blockierte Bewerbungs-Zeitfenster]     (bestehend)
[Auftragstermine blockieren]            (NEU)
[Blockierte Auftrags-Zeitfenster]       (NEU)
```

### Zeitslots fuer Auftragstermine
Fest: 08:00, 08:30, 09:00, ... 17:00, 17:30 (30-Min-Intervalle, wie in AuftragDetails.tsx definiert)

### Aenderungen pro Datei

**Migration** (neue Datei):
- CREATE TABLE + RLS enable + Policies

**AdminZeitplan.tsx**:
- Neue States: `selectedOrderDate`, `orderBlockReason`
- Neue Query: `order-appointment-blocked-slots`
- Neue Mutations: `orderBlockMutation`, `orderUnblockMutation`
- Neue Card-Sektionen mit Kalender + Slot-Grid + Liste (gleiche UI-Patterns wie bestehend)

**AuftragDetails.tsx**:
- Query fuer `order_appointment_blocked_slots` beim gewaehlten Datum
- Filter in `availableTimeSlots` um blockierte Zeiten auszuschliessen
