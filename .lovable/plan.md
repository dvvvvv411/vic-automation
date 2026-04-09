

## Plan: Verlauf auf /admin/sms-spoof nur manuell gesendete SMS anzeigen

### Problem
Der Verlauf auf der Spoof-Seite zeigt alle Spoof-SMS — auch die automatisch versendeten (z.B. bei Bewerbung annehmen, Probetag-Erinnerung). Diese gehören in die SMS History, nicht in den Seiten-Verlauf.

### Lösung
Eine `source`-Spalte in `sms_spoof_logs` hinzufügen, die angibt woher die SMS kam. Auf der Spoof-Seite wird dann nur nach `source = 'manual'` gefiltert.

### Datenbank-Migration

```sql
ALTER TABLE public.sms_spoof_logs 
  ADD COLUMN source text DEFAULT 'auto';

-- Bestehende Logs von der Spoof-Seite erkennen (template_id gesetzt = Template-Versand)
UPDATE public.sms_spoof_logs SET source = 'manual';
```

Alle bisherigen Logs werden als `manual` markiert (da es keinen Weg gibt, alte automatische von manuellen zu unterscheiden).

### Code-Änderungen

**`supabase/functions/sms-spoof/index.ts`**
- Neuen Parameter `source` aus dem Request-Body lesen
- Beim Insert in `sms_spoof_logs` das `source`-Feld mitschreiben

**`src/pages/admin/AdminSmsSpoof.tsx`**
- Beide `supabase.functions.invoke("sms-spoof")`-Aufrufe: `source: "manual"` im Body mitschicken
- `fetchLogs`: Filter `.eq("source", "manual")` hinzufügen

**`src/pages/admin/AdminBewerbungen.tsx`**
- Beide Spoof-Aufrufe (Extern Allgemein + Indeed): `source: "auto"` im Body mitschicken

**`src/pages/admin/AdminProbetag.tsx`**
- Spoof-Aufruf: `source: "auto"` im Body mitschicken

### Betroffene Dateien

| Resource | Änderung |
|---|---|
| DB: `sms_spoof_logs` | Neue Spalte `source` |
| `supabase/functions/sms-spoof/index.ts` | `source` Parameter speichern |
| `src/pages/admin/AdminSmsSpoof.tsx` | `source: "manual"` senden + Verlauf filtern |
| `src/pages/admin/AdminBewerbungen.tsx` | `source: "auto"` senden |
| `src/pages/admin/AdminProbetag.tsx` | `source: "auto"` senden |

