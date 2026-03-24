

## Plan: Erinnerungs-Zaehler mit rotem Badge auf Buttons

### Konzept

Zwei neue DB-Spalten tracken wie oft erinnert/benachrichtigt wurde. Die Buttons zeigen einen roten Kreis mit der Anzahl an (nur wenn > 0).

### 1. DB-Migration

```sql
ALTER TABLE public.interview_appointments
  ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS notification_count integer NOT NULL DEFAULT 0;
```

### 2. AdminBewerbungsgespraeche.tsx

- **Select erweitern**: `reminder_count` wird bereits automatisch mit `*` geladen
- **Nach erfolgreichem Senden** (`handleConfirmReminder`): Supabase-Update `reminder_count = (aktueller Wert + 1)` auf `interview_appointments` + Query invalidieren
- **Button-Rendering** (Zeile ~413-422): Wrapper `relative` um den Button, darin ein `span` mit rotem Kreis + Zahl wenn `item.reminder_count > 0`

### 3. AdminBewerbungen.tsx

- **Select**: `notification_count` wird mit `*` geladen
- **Nach erfolgreichem resendMutation**: Supabase-Update `notification_count = notification_count + 1` auf `applications` + Query invalidieren
- **Button-Rendering** (Zeile ~706-712): Gleicher roter Badge auf dem RotateCcw-Button wenn `app.notification_count > 0`

### Badge-Stil (beide Stellen identisch)

```tsx
<div className="relative">
  <Button ...>
    <MessageSquare className="h-4 w-4" />
  </Button>
  {item.reminder_count > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
      {item.reminder_count}
    </span>
  )}
</div>
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | 2 neue Spalten |
| `AdminBewerbungsgespraeche.tsx` | Increment nach Senden + roter Badge |
| `AdminBewerbungen.tsx` | Increment nach Resend + roter Badge |

