

# Fix: Mitarbeiter kann Auftrag nicht annehmen (fehlende RLS-Berechtigung)

## Problem

Wenn der Mitarbeiter im Livechat auf "Annehmen" klickt, versucht der Code einen Eintrag in `order_assignments` zu erstellen. Die RLS-Policy erlaubt INSERT aber nur fuer Admins. Daher schlaegt die Zuweisung still fehl, waehrend der Termin (`order_appointments`) korrekt erstellt wird (dort hat der User INSERT-Rechte).

## Loesung

Eine neue RLS-Policy auf `order_assignments` hinzufuegen, die es Mitarbeitern erlaubt, Zuweisungen fuer sich selbst zu erstellen -- aber NUR wenn eine entsprechende Systemnachricht mit `order_offer` Metadata im Chat existiert. So kann sich ein Mitarbeiter nicht beliebig Auftraege zuweisen, sondern nur solche, die ihm vom Admin angeboten wurden.

### Datenbank-Migration

```sql
CREATE POLICY "Users can insert own assignments from chat offers"
  ON public.order_assignments
  FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM employment_contracts
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM chat_messages
      WHERE chat_messages.contract_id = order_assignments.contract_id
        AND chat_messages.sender_role = 'system'
        AND (chat_messages.metadata->>'type') = 'order_offer'
        AND (chat_messages.metadata->>'order_id')::uuid = order_assignments.order_id
    )
  );
```

Dies stellt sicher:
1. Der Mitarbeiter kann nur Zuweisungen fuer seinen eigenen Vertrag erstellen
2. Es muss eine passende Systemnachricht mit `order_offer` fuer genau diesen Auftrag existieren (vom Admin gesendet)

### Keine Code-Aenderungen noetig

Die Logik in `ChatWidget.tsx` (`handleAcceptOrder`) ist bereits korrekt implementiert. Sobald die RLS-Policy existiert, funktioniert der gesamte Flow.

