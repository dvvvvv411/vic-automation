## Ziel
Alle 37 Aufträge vom Branding **Efficient Flow Solutions GmbH** (`4db57b23…`) zum Branding **for.tel Solutions GmbH** (`a49c0302…`) kopieren.

## Vorgehen
Eine SQL-Insert-Operation auf `orders`:

```sql
INSERT INTO orders (branding_id, title, description, reward, order_type,
  is_starter_job, is_videochat, estimated_hours, required_attachments,
  /* alle weiteren inhaltlichen Spalten außer id/created_at/updated_at */)
SELECT 'a49c0302-65a5-4e87-b873-5a5757f41057', title, description, reward, ...
FROM orders
WHERE branding_id = '4db57b23-f32a-4860-9f71-1f4309302bb3';
```

Konkret: neue `id` (default), `branding_id` auf for.tel gesetzt, alle restlichen Felder 1:1 übernommen.

## Was NICHT mitkopiert wird
- `order_assignments` (Mitarbeiter-Zuweisungen) — gehören zu Mitarbeitern des alten Brandings
- `order_attachments`-Vorlagen werden nur als Spaltenwert (`required_attachments` JSONB) kopiert, keine Storage-Dateien dupliziert
- `order_appointments` / Blocked Slots

## Sicherheit
- Keine Schema-Änderung.
- Bestehende Aufträge bei for.tel bleiben unberührt; es werden 37 neue Zeilen hinzugefügt.
- Falls Duplikate beim erneuten Ausführen vermieden werden sollen: einmalig laufen lassen.

## Bestätigung gewünscht
- Sollen wirklich **alle 37** kopiert werden? (Liste oben in den Logs sichtbar)
- Sollen Starter-Job-Flags (`is_starter_job=true`) übernommen werden? Diese würden via Trigger neuen for.tel-Mitarbeitern automatisch zugewiesen.
