

## Plan: "Email TAN ist unterwegs" Button + Telegram Event

### Aenderungen

**1. `src/pages/admin/AdminTelegram.tsx` — Neuen Event-Type hinzufuegen**

In `EVENT_TYPES` Array (Zeile 16-26) einen neuen Eintrag:
```typescript
{ key: "email_tan_angefordert", label: "Email TAN angefordert", desc: "Mitarbeiter wartet auf Email TAN Eingabe" },
```

Damit ist das Event pro Chat-ID aktivierbar/deaktivierbar wie alle anderen Events.

**2. `src/pages/mitarbeiter/AuftragDetails.tsx` — Button in Email TAN Card**

In der Email TAN Card (Zeile 753-782) einen Button hinzufuegen:
- Label: "Email TAN ist unterwegs" mit Mail-Icon
- Neuer State `emailTanRequested` mit 30-Sekunden Cooldown
- Klick ruft `sendTelegram("email_tan_angefordert", ...)` auf mit Mitarbeitername und Auftragstitel
- Toast: "Anfrage gesendet"
- Button zeigt nach Klick "Anfrage gesendet ✓" und ist disabled waehrend Cooldown

Die benoetigten Daten (`contract.first_name`, `order.title`) sind bereits im Component verfuegbar.

**3. `src/lib/sendTelegram.ts` — Optionaler `branding_id` Parameter**

Erweitern um optionalen `branding_id` Parameter, der an die Edge Function weitergereicht wird.

**4. `supabase/functions/send-telegram/index.ts` — Branding-Filter**

Neuer optionaler Body-Parameter `branding_id`. Wenn gesetzt, werden nur Chat-IDs benachrichtigt wo `branding_ids` leer ist ODER die branding_id enthaelt. Dafuer wird nach dem Event-Filter zusaetzlich in JS gefiltert (da Postgres-Array-Operationen ueber Supabase-Client limitiert sind).

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminTelegram.tsx` | Neuer Event `email_tan_angefordert` in EVENT_TYPES |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | Button + Cooldown State + sendTelegram-Aufruf |
| `src/lib/sendTelegram.ts` | Optionaler `branding_id` Parameter |
| `supabase/functions/send-telegram/index.ts` | Branding-basierte Filterung |

