
Ziel: Telegram für Probetag-Buchungen wirklich aktivieren. Der Trigger auf der Buchungsseite funktioniert bereits, aber es gibt aktuell keinen passenden Empfänger.

1. Befund
- `src/pages/Probetag.tsx` ruft bereits `sendTelegram("probetag_gebucht", ..., application.branding_id)` auf.
- Die `send-telegram` Edge Function wurde zum Buchungszeitpunkt gestartet, also wurde sie aufgerufen.
- In `telegram_chats` gibt es aktuell keinen Chat mit dem Event `probetag_gebucht`.
- In `src/pages/admin/AdminTelegram.tsx` fehlt `probetag_gebucht` komplett in `EVENT_TYPES`. Deshalb kann man den Event im Admin gar nicht aktivieren.
- Der Efficient-Flow-Chat ist vorhanden und korrekt auf das Branding gefiltert, aber seine `events`-Liste enthält nur z. B. `gespraech_gebucht`, nicht `probetag_gebucht`.

2. Umsetzung
- `src/pages/admin/AdminTelegram.tsx`
  - `EVENT_TYPES` um `probetag_gebucht` ergänzen.
  - Dadurch erscheint der Event:
    - beim Anlegen neuer Telegram-Chats
    - beim Bearbeiten bestehender Chats
    - in der Event-Übersicht

- `supabase/migrations/...`
  - Eine kleine Backfill-Migration ergänzen, damit bestehende Chat-Konfigurationen sofort repariert werden.
  - Vorschlag: `probetag_gebucht` automatisch zu allen Chats hinzufügen, die bereits `gespraech_gebucht` abonniert haben.
  - Das ist die konservativste sinnvolle Regel, weil beide Events fachlich zu Terminbuchungen gehören und genau diese Lücke hier entstanden ist.

  Beispielrichtung:
  ```sql
  update public.telegram_chats
  set events = array_append(events, 'probetag_gebucht')
  where 'gespraech_gebucht' = any(events)
    and not ('probetag_gebucht' = any(events));
  ```

- `src/lib/sendTelegram.ts` oder `supabase/functions/send-telegram/index.ts`
  - Diagnose verbessern:
    - Response von `supabase.functions.invoke("send-telegram")` auswerten
    - wenn `sent = 0`, im Client oder in der Function einen klaren Warnhinweis loggen
  - So sieht man künftig sofort, ob ein Event ausgelöst wurde, aber kein Chat dafür konfiguriert war.

3. Was ich nicht ändern würde
- `src/pages/Probetag.tsx` selbst muss für dieses konkrete Problem nicht nochmals geändert werden; der `branding_id`-Fix ist dort schon drin.
- Die Branding-Zuordnung ist nicht das Problem mehr.

4. Erwartetes Ergebnis
- Bestehende Efficient-Flow-Chat-Konfigurationen erhalten `probetag_gebucht` automatisch, wenn sie schon `gespraech_gebucht` abonniert hatten.
- Neue Probetag-Buchungen schicken danach wieder Telegram-Nachrichten.
- Im Admin kann der Event anschließend sichtbar geprüft und manuell ein-/ausgeschaltet werden.
- Künftige Fehlkonfigurationen sind leichter erkennbar, weil `sent: 0` nicht mehr still verschluckt wird.

5. Technische Details
- Betroffene Dateien:
  - `src/pages/admin/AdminTelegram.tsx`
  - `src/lib/sendTelegram.ts` oder `supabase/functions/send-telegram/index.ts`
  - `supabase/migrations/...`
- Kein neues Secret nötig.
- Keine Änderung an RLS nötig, solange `telegram_chats` bereits vom Admin verwaltet werden kann.
