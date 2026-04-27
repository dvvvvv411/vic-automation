## Plan: Telegram-Notification beim Buchen des 1. Arbeitstags

### Befund
Im Code wird beim Buchen eines 1.-Arbeitstag-Termins (`src/pages/ErsterArbeitstag.tsx`, Zeile 206) bereits ein Telegram-Event gefeuert:

```ts
sendTelegram("erster_arbeitstag_gebucht", "...", contract?.branding_id)
```

Es kommt nur deshalb keine Nachricht an, weil das Event `erster_arbeitstag_gebucht` **nicht** in der Eventliste von `/admin/telegram` (`AdminTelegram.tsx` → Konstante `EVENT_TYPES`) auftaucht. Dadurch kann kein Chat darauf abonniert werden, und in der DB-Spalte `telegram_chats.events` taucht es nie auf → die Edge Function `send-telegram` filtert es weg.

### Änderung

**Datei:** `src/pages/admin/AdminTelegram.tsx`

In der Konstante `EVENT_TYPES` einen neuen Eintrag ergänzen — direkt nach `auftragstermin_gebucht`:

```ts
{ key: "erster_arbeitstag_gebucht", label: "Erster Arbeitstag gebucht", desc: "Mitarbeiter bucht den ersten Arbeitstag" },
```

### Was passiert danach
1. Im Admin-Panel `/admin/telegram` erscheint das neue Event in der Checkbox-Liste sowohl beim Anlegen eines Chats als auch in der Bearbeitung bestehender Chats und in der „Event-Übersicht"-Tabelle.
2. Du hakst es bei deinen gewünschten Telegram-Chat-IDs an → ab dann triggert jede 1.-Arbeitstag-Buchung eine Telegram-Nachricht (mit `branding_id`-Filter, wie alle anderen Events).

### Was NICHT angefasst wird
- `ErsterArbeitstag.tsx` (Event wird bereits korrekt gefeuert)
- `send-telegram` Edge Function (funktioniert generisch)
- DB-Schema, Spoof, SMS, Reminder — unverändert
