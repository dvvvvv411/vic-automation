

# Auftrag direkt im Livechat zuweisen

## Uebersicht

Im Admin-Livechat wird ein "+ Auftrag"-Button im Header angezeigt, sobald ein Chat aktiv ist. Ueber ein Popup kann der Admin einen noch nicht zugewiesenen Auftrag auswaehlen. Dem Mitarbeiter wird eine interaktive Systemnachricht gesendet, ueber die er den Auftrag annehmen kann. Bei Nicht-Platzhalter-Auftraegen wird der Termin automatisch auf den aktuellen Zeitpunkt gebucht.

## Ablauf

1. Admin klickt "+ Auftrag" im Chat-Header
2. Popup zeigt alle Auftraege, die dem Mitarbeiter NOCH NICHT zugewiesen sind
3. Admin waehlt einen Auftrag aus und bestaetigt
4. Eine Systemnachricht wird in den Chat eingefuegt mit Auftragsinfos
5. Auf der Mitarbeiter-Seite wird die Systemnachricht mit einem "Annehmen"-Button dargestellt
6. Mitarbeiter klickt "Annehmen":
   - `order_assignment` wird erstellt (Status "offen")
   - Bei Nicht-Platzhalter-Auftraegen: `order_appointment` wird automatisch mit aktuellem Datum/Uhrzeit erstellt
   - Mitarbeiter wird zu `/mitarbeiter/auftragdetails/{order_id}` navigiert
   - Livechat bleibt geoeffnet
7. Bewertung wird NICHT automatisch freigeschaltet (wie gewuenscht manuell durch Admin)

## Technische Details

### 1. Datenbank: Neue Spalte `metadata` in `chat_messages`

```sql
ALTER TABLE public.chat_messages
  ADD COLUMN metadata jsonb DEFAULT NULL;
```

Dies ermoeglicht das Speichern von strukturierten Daten in Systemnachrichten, z.B.:

```json
{
  "type": "order_offer",
  "order_id": "uuid",
  "order_title": "App-Test XY",
  "order_number": "A-001",
  "reward": "25€",
  "is_placeholder": false
}
```

### 2. Admin-Livechat (`src/pages/admin/AdminLivechat.tsx`)

- Neuer "+ Auftrag"-Button im Header (neben den SMS-Buttons), nur sichtbar wenn ein Chat aktiv ist
- Klick oeffnet ein Dialog mit einer Liste aller Auftraege, die dem aktuellen Mitarbeiter (contract_id) noch nicht zugewiesen sind
- Nach Auswahl wird eine Systemnachricht mit metadata `type: "order_offer"` in den Chat eingefuegt

### 3. ChatMessage-Typ erweitern (`src/components/chat/useChatRealtime.ts`)

- `metadata` Feld zum `ChatMessage` Interface hinzufuegen (optional, jsonb)

### 4. SystemMessage erweitern (`src/components/chat/ChatBubble.tsx`)

- Neue Variante der `SystemMessage`-Komponente, die bei vorhandenem `metadata.type === "order_offer"` eine Auftrags-Karte mit "Annehmen"-Button rendert
- Der Button ist nur auf der Mitarbeiter-Seite (ChatWidget) aktiv
- Nach Annahme wird der Button durch "Angenommen" ersetzt

### 5. ChatWidget - Annahme-Logik (`src/components/chat/ChatWidget.tsx`)

- Wenn Mitarbeiter auf "Annehmen" klickt:
  1. `order_assignment` INSERT mit `order_id` und `contract_id`
  2. Falls `is_placeholder === false`: `order_appointment` INSERT mit aktuellem Datum und aktueller Uhrzeit
  3. Systemnachricht senden: "Auftrag angenommen"
  4. Navigation zu `/mitarbeiter/auftragdetails/{order_id}`

### 6. Mitarbeiter-Auftragsdetails (`src/pages/mitarbeiter/AuftragDetails.tsx`)

- Keine Aenderung noetig: Der Auftrag wird bereits korrekt angezeigt, wenn eine Zuweisung und ggf. ein Termin existieren

## Zusammenfassung

| Wo | Was |
|---|---|
| Datenbank | Neue nullable `metadata` jsonb-Spalte in `chat_messages` |
| AdminLivechat.tsx | "+ Auftrag"-Button + Auftrags-Auswahl-Dialog |
| useChatRealtime.ts | `metadata` Feld im ChatMessage Interface |
| ChatBubble.tsx | Interaktive SystemMessage mit Annehmen-Button |
| ChatWidget.tsx | Annahme-Logik (Assignment + Appointment + Navigation) |

