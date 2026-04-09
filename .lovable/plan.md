

## Plan: Extern (Allg.) → Extern (META) umlabeln

### Was passiert
420 Bewerbungen die aktuell `is_external = true, is_meta = false` sind, werden auf `is_meta = true, is_external = false` gesetzt. Die 111 Bewerbungen vom heutigen Massenimport (created_at >= '2026-04-09 17:23:00') bleiben unverändert.

### SQL (per Insert-Tool)
```sql
UPDATE applications 
SET is_meta = true, is_external = false
WHERE is_external = true 
  AND is_meta = false 
  AND is_indeed = false
  AND created_at < '2026-04-09 17:23:00';
```

### Betroffene Ressourcen
| Resource | Änderung |
|---|---|
| DB: `applications` | 420 Zeilen: `is_meta` → true, `is_external` → false |

Keine Code-Änderungen nötig.

