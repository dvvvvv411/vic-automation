

# Fix: Systemnachricht im Chat nach Terminbuchung

## Problem

Die RLS-Policy auf `chat_messages` erlaubt Mitarbeitern nur das Einfuegen von Nachrichten mit `sender_role = 'user'`. Beim Buchen eines Termins versucht der Code eine Nachricht mit `sender_role = 'system'` einzufuegen, was von der Policy stillschweigend blockiert wird.

## Loesung

Die bestehende RLS-Policy "Users can insert own chat_messages" wird erweitert, sodass Mitarbeiter auch Nachrichten mit `sender_role = 'system'` einfuegen duerfen.

## Technische Umsetzung

### Migration

```sql
DROP POLICY "Users can insert own chat_messages" ON chat_messages;

CREATE POLICY "Users can insert own chat_messages" ON chat_messages
  FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM employment_contracts WHERE user_id = auth.uid()
    )
    AND sender_role IN ('user', 'system')
  );
```

Das ist die einzige Aenderung -- kein Code-Update noetig, da die Insert-Logik in `AuftragDetails.tsx` bereits korrekt implementiert ist.
