

# Fix: Kunde sieht keine Chat-Nachrichten von Mitarbeitern

## Ursache

Die RLS-Policy "Kunden can select own chat_messages" prüft `created_by = auth.uid()`. Aber `created_by` in `chat_messages` ist bei allen Nachrichten `NULL` — es wird beim Insert nie gesetzt. Daher sieht der Kunde keine einzige Nachricht.

Gleiches Problem bei der UPDATE-Policy für Kunden.

## Lösung

Die Kunde-Policies auf Contract-Ownership umstellen statt `created_by` zu prüfen. Ein Kunde soll alle Nachrichten sehen/updaten können, die zu Verträgen gehören, die er erstellt hat (`employment_contracts.created_by = auth.uid()`).

### Migration (SQL)

```sql
-- Fix SELECT: Kunde sieht Nachrichten seiner Verträge
DROP POLICY "Kunden can select own chat_messages" ON public.chat_messages;
CREATE POLICY "Kunden can select own chat_messages" ON public.chat_messages
FOR SELECT TO authenticated
USING (
  is_kunde(auth.uid()) AND
  contract_id IN (
    SELECT id FROM employment_contracts WHERE created_by = auth.uid()
  )
);

-- Fix UPDATE: Kunde kann Nachrichten seiner Verträge updaten
DROP POLICY IF EXISTS "Admins can update chat_messages" ON public.chat_messages;
CREATE POLICY "Admins can update chat_messages" ON public.chat_messages
FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(), 'admin') AND (created_by = auth.uid() OR created_by IS NULL))
  OR (is_kunde(auth.uid()) AND contract_id IN (
    SELECT id FROM employment_contracts WHERE created_by = auth.uid()
  ))
);
```

### Auch Realtime betroffen

Die Realtime-Subscription auf Zeile 148-153 in `AdminLivechat.tsx` hat keinen Filter. Postgres Changes respektiert RLS — nach dem Policy-Fix werden die Events automatisch beim Kunden ankommen.

| Änderung | Beschreibung |
|----------|-------------|
| Migration (SQL) | Kunde SELECT/UPDATE Policies auf Contract-Ownership umstellen |

Keine Code-Änderungen nötig — nur RLS-Policies.

