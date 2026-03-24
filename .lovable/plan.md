

## Plan: Klickbare Badges mit Timestamp-Historie

### Konzept

Die roten Badges werden klickbar. Bei Klick oeffnet sich ein Popover/Dialog mit allen Zeitpunkten, wann die Erinnerung/Benachrichtigung gesendet wurde. Dafuer brauchen wir eine neue DB-Spalte (JSONB-Array) statt nur eines Zaehlers.

### 1. DB-Migration

Zwei neue JSONB-Spalten fuer die Timestamps (zusaetzlich zu den bestehenden Count-Spalten):

```sql
ALTER TABLE public.interview_appointments
  ADD COLUMN IF NOT EXISTS reminder_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS notification_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb;
```

### 2. AdminBewerbungsgespraeche.tsx

- **Beim Senden**: Neben `reminder_count` Increment auch den aktuellen Timestamp ins `reminder_timestamps` Array pushen:
  ```typescript
  reminder_timestamps: [...(item.reminder_timestamps || []), new Date().toISOString()]
  ```
- **Badge**: `pointer-events-none` entfernen, Badge wird klickbar
- **Popover**: Bei Klick auf Badge oeffnet sich ein kleines Popover (oder Dialog) mit einer Liste der Timestamps, formatiert als `dd.MM.yyyy HH:mm`

### 3. AdminBewerbungen.tsx

- **Beim Resend**: Gleiche Logik — Timestamp ins `notification_timestamps` Array pushen
- **Badge klickbar** mit Popover/Liste der Timestamps

### Badge-Popover Beispiel

```tsx
<Popover>
  <PopoverTrigger asChild>
    <span className="absolute -top-1 -right-1 bg-destructive ... cursor-pointer">
      {count}
    </span>
  </PopoverTrigger>
  <PopoverContent className="w-56 p-3">
    <p className="text-sm font-semibold mb-2">Gesendet am:</p>
    <ul className="space-y-1 text-xs text-muted-foreground">
      {timestamps.map(ts => <li>{format(new Date(ts), "dd.MM.yyyy HH:mm")}</li>)}
    </ul>
  </PopoverContent>
</Popover>
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | 2 neue JSONB-Spalten |
| `AdminBewerbungsgespraeche.tsx` | Timestamp speichern + klickbares Badge mit Popover |
| `AdminBewerbungen.tsx` | Timestamp speichern + klickbares Badge mit Popover |

