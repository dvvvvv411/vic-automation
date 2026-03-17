

## Plan: Telegram-Benachrichtigung bei neuer Bewerbung

### Problem

Die `submit-application` Edge Function (fuer externe Formulare) und die manuelle Bewerbungsanlage im Admin senden keine Telegram-Benachrichtigung. Es existiert kein Event-Type `bewerbung_eingegangen` im Telegram-System.

### Aenderungen

**1. `src/pages/admin/AdminTelegram.tsx` — Neuen Event-Type hinzufuegen**

Neuer Eintrag in `EVENT_TYPES`:
```typescript
{ key: "bewerbung_eingegangen", label: "Neue Bewerbung", desc: "Neue Bewerbung ist eingegangen" },
```

**2. `supabase/functions/submit-application/index.ts` — Telegram-Aufruf nach Insert**

Nach dem erfolgreichen Insert (Zeile ~173) einen Aufruf an `send-telegram` ergaenzen:
```typescript
try {
  const sendTelegramUrl = `${supabaseUrl}/functions/v1/send-telegram`;
  await fetch(sendTelegramUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
    body: JSON.stringify({
      event_type: "bewerbung_eingegangen",
      message: `📝 Neue Bewerbung eingegangen\n\nName: ${first_name} ${last_name}\nE-Mail: ${email}`,
      branding_id: branding_id || undefined,
    }),
  });
} catch (tgErr) {
  console.error("Telegram notification failed:", tgErr);
}
```

**3. `src/pages/admin/AdminBewerbungen.tsx` — Telegram bei manueller Anlage**

Nach erfolgreichem manuellen Insert einer Bewerbung ebenfalls `sendTelegram("bewerbung_eingegangen", ...)` aufrufen mit Name und Branding-ID.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminTelegram.tsx` | Neuer Event `bewerbung_eingegangen` |
| `supabase/functions/submit-application/index.ts` | Telegram-Aufruf nach Insert |
| `src/pages/admin/AdminBewerbungen.tsx` | Telegram bei manueller Anlage |

