
# Telegram-Benachrichtigungen fuer Admin-Events

## Uebersicht

Neue Admin-Einstellungsseite unter `/admin/telegram` mit Verwaltung von Telegram Chat-IDs und Zuordnung zu Ereignissen. Eine neue Edge Function `send-telegram` uebernimmt den Versand. Die relevanten Stellen im Code werden erweitert, um nach bestehenden Aktionen (Email/SMS) auch eine Telegram-Nachricht auszuloesen.

## Datenbank

### Neue Tabelle: `telegram_chats`

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid (PK) | Auto-generiert |
| chat_id | text | Telegram Chat-ID |
| label | text | Bezeichnung (z.B. "Hauptgruppe") |
| events | text[] | Array der aktivierten Event-Typen |
| created_at | timestamptz | Erstellungsdatum |

RLS: Nur Admins koennen lesen, erstellen, aendern und loeschen.

### Event-Typen

```text
gespraech_gebucht         - Bewerber bucht Bewerbungsgespraech
vertrag_eingereicht       - Bewerber fuellt Arbeitsvertrag aus
vertrag_unterzeichnet     - Bewerber/Mitarbeiter unterzeichnet Vertrag
auftragstermin_gebucht    - Mitarbeiter bucht Auftragstermin
chat_nachricht            - Mitarbeiter schreibt im Livechat
bewertung_eingereicht     - Mitarbeiter schickt Bewertung ab
```

## Edge Function: `send-telegram`

Neue Edge Function unter `supabase/functions/send-telegram/index.ts`:

- Empfaengt: `{ event_type, message }`
- Liest aus `telegram_chats` alle Chat-IDs, die diesen `event_type` abonniert haben
- Sendet per Telegram Bot API (`https://api.telegram.org/bot{TOKEN}/sendMessage`) an jede Chat-ID
- Benoetigt neues Secret: `TELEGRAM_BOT_TOKEN`

## Admin-Seite: `/admin/telegram`

### Aufbau der Seite

1. **Anleitung** (aufklappbares Accordion oben):
   - BotFather oeffnen in Telegram (@BotFather)
   - `/newbot` senden und Bot-Namen vergeben
   - Bot-Token kopieren und in Supabase Secrets speichern
   - Bot zur gewuenschten Gruppe hinzufuegen oder Privatnachricht senden
   - Chat-ID ermitteln (z.B. via `https://api.telegram.org/bot{TOKEN}/getUpdates`)

2. **Chat-IDs verwalten** (Karten-Liste):
   - Chat-ID und Label eingeben
   - Checkboxen fuer jeden Event-Typ (welche Benachrichtigungen soll diese Chat-ID erhalten)
   - Speichern / Loeschen

3. **Event-Uebersicht** (Tabelle):
   - Alle 6 Event-Typen mit Beschreibung
   - Anzeige welche Chat-IDs jeweils aktiv sind

## Integration in bestehenden Code

### 1. Bewerbungsgespraech gebucht (`src/pages/Bewerbungsgespraech.tsx`)
Nach dem erfolgreichen `insert` in `interview_appointments` (Zeile 106): Edge Function `send-telegram` aufrufen mit Event `gespraech_gebucht` und Nachricht inkl. Name, Datum, Uhrzeit.

### 2. Arbeitsvertrag eingereicht (`src/pages/Arbeitsvertrag.tsx`)
Nach dem erfolgreichen `rpc("submit_employment_contract")` (Zeile 250): Telegram-Nachricht mit Event `vertrag_eingereicht` und Name.

### 3. Vertrag unterzeichnet (`supabase/functions/sign-contract/index.ts`)
Am Ende nach erfolgreicher Unterschrift: Fetch an `send-telegram` mit Event `vertrag_unterzeichnet` und Name.

### 4. Auftragstermin gebucht (`src/pages/mitarbeiter/AuftragDetails.tsx`)
Nach dem `insert` in `order_appointments` (Zeile 161): Telegram-Nachricht mit Event `auftragstermin_gebucht` und Name, Auftragstitel, Datum, Uhrzeit.

### 5. Livechat-Nachricht (`src/components/chat/useChatRealtime.ts`)
Nach dem `insert` in `chat_messages` bei `senderRole === "user"`: Telegram-Nachricht mit Event `chat_nachricht` und Nachrichteninhalt (gekuerzt).

### 6. Bewertung eingereicht (`src/pages/mitarbeiter/Bewertung.tsx`)
Nach dem `insert` in `order_reviews` (Zeile 125): Telegram-Nachricht mit Event `bewertung_eingereicht` und Name, Auftragstitel.

## Hilfsfunktion

Neue Datei `src/lib/sendTelegram.ts` -- ein kleiner Wrapper, der die Edge Function `send-telegram` aufruft:

```typescript
export async function sendTelegram(eventType: string, message: string) {
  try {
    await supabase.functions.invoke("send-telegram", {
      body: { event_type: eventType, message },
    });
  } catch (e) {
    console.error("Telegram notification failed:", e);
  }
}
```

Fehler werden nur geloggt, nie geworfen -- Telegram-Benachrichtigungen sollen niemals den Hauptprozess blockieren.

## Navigation

- Neuer Eintrag in `AdminSidebar.tsx` unter "Einstellungen": "Telegram" mit `MessageCircle`-Icon (oder passendem Telegram-Icon) und URL `/admin/telegram`
- Neue Route in `App.tsx`: `<Route path="telegram" element={<AdminTelegram />} />`

## Neues Secret

`TELEGRAM_BOT_TOKEN` muss als Supabase Secret gesetzt werden. Auf der Telegram-Seite wird erklaert, wie man den Token vom BotFather erhaelt.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration (SQL) | Neue Tabelle `telegram_chats` mit RLS |
| `supabase/functions/send-telegram/index.ts` | Neue Edge Function |
| `supabase/config.toml` | Eintrag fuer `send-telegram` |
| `src/lib/sendTelegram.ts` | Hilfsfunktion |
| `src/pages/admin/AdminTelegram.tsx` | Neue Admin-Seite |
| `src/components/admin/AdminSidebar.tsx` | Neuer Nav-Eintrag |
| `src/App.tsx` | Neue Route |
| `src/pages/Bewerbungsgespraech.tsx` | Telegram-Aufruf |
| `src/pages/Arbeitsvertrag.tsx` | Telegram-Aufruf |
| `supabase/functions/sign-contract/index.ts` | Telegram-Aufruf |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | Telegram-Aufruf |
| `src/components/chat/useChatRealtime.ts` | Telegram-Aufruf |
| `src/pages/mitarbeiter/Bewertung.tsx` | Telegram-Aufruf |
