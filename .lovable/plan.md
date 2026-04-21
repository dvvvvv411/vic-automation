

## Ursache

In `src/pages/admin/AdminLivechat.tsx` wird die Konversationsliste so geladen:

```ts
supabase.from("chat_messages")
  .select("contract_id, content, created_at, read, sender_role")
  .in("contract_id", contractIds)
  .order("created_at", { ascending: false });
```

**Kein `.limit()`** — d. h. Supabase greift auf das **Default-Limit von 1000 Zeilen** zurück. Sobald in den letzten ~7 Tagen 1000 Chat-Nachrichten zusammenkommen, fallen alle älteren Konversationen aus der Liste raus, weil ihre letzte Nachricht gar nicht erst geladen wird. Genau dein Symptom: „nur die letzten 7 Tage sichtbar".

Das ist exakt das Muster aus Memory `tech/supabase-row-limit-constraint`.

## Fix

**Datei:** `src/pages/admin/AdminLivechat.tsx` → `loadConversations`

Statt eine flache `chat_messages`-Query mit implizitem 1000-Limit zu nutzen, in **Batches per `.range()`** über alle Nachrichten der relevanten Contracts loopen, bis nichts mehr kommt:

```ts
const pageSize = 1000;
let from = 0;
let allMsgs: any[] = [];
while (true) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("contract_id, content, created_at, read, sender_role")
    .in("contract_id", contractIds)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error || !data?.length) break;
  allMsgs = allMsgs.concat(data);
  if (data.length < pageSize) break;
  from += pageSize;
}
```

Zusätzlich: `contractIds` selbst kann ebenfalls > 1000 sein. Die `employment_contracts`-Query oben bekommt denselben `.range()`-Loop, damit auch alle Verträge geladen werden (nicht nur 1000).

Beim `.in("contract_id", contractIds)`-Filter wird `contractIds` bei sehr vielen Verträgen zusätzlich in Chunks à 500 IDs zerlegt, um URL-Längen-Limits zu vermeiden.

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminLivechat.tsx` | `loadConversations`: Batch-Loop mit `.range()` für `employment_contracts` und `chat_messages`, Chunking der `contractIds` |

## Was NICHT geändert wird

- Keine DB-Migration
- Kein Edge-Function-Code
- Keine UI-Änderung — nur die Datenladelogik wird vollständig

## Erwartetes Ergebnis

Nach dem Fix erscheinen wieder **alle Konversationen** im Livechat, unabhängig davon wie alt die letzte Nachricht ist. Die Sortierung (neueste zuerst) bleibt identisch.

