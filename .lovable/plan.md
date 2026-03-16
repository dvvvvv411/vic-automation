

# Fix: Datenkorrektur für indeedpic@yopmail.com

## Problem

Der Auftrag "Mobile Bewertung & Ablauf-Test – Deutsche Bank" (`c28d539d`) ist fälschlicherweise als `erfolgreich` markiert, obwohl alle 3 Pflichtanhänge noch den Status `eingereicht` haben (nicht `genehmigt`).

## Lösung

Eine SQL-Migration ausführen die den `order_assignments.status` von `erfolgreich` zurück auf `in_pruefung` setzt:

```sql
UPDATE order_assignments
SET status = 'in_pruefung'
WHERE order_id = 'c28d539d-8463-4c23-b329-dba1d9d64f58'
  AND contract_id = '9f392f86-c779-426b-82bb-a6fc15abfdfe'
  AND status = 'erfolgreich';
```

- Reward war `0`, daher muss keine Balance korrigiert werden
- Danach zeigt das Mitarbeiter-Panel korrekt "In Überprüfung" oder "Anhänge einreichen" an
- Sobald der Admin die 3 Anhänge genehmigt, greift die neue Auto-Abschluss-Logik aus `AdminAnhaengeDetail.tsx`

### Betroffene Dateien
Keine Code-Änderungen — nur ein Daten-Fix per SQL-Migration.

