

## Unterschrift-Fehler bei Kundenkonto

### Ursache

Die Storage-Policies für den `branding-logos` Bucket erlauben nur Admins das Hochladen/Aktualisieren/Löschen:

- **INSERT**: `has_role(auth.uid(), 'admin')` -- Kunde wird blockiert
- **UPDATE**: `has_role(auth.uid(), 'admin')` -- Kunde wird blockiert  
- **DELETE**: `has_role(auth.uid(), 'admin')` -- Kunde wird blockiert

Wenn ein Kunde eine Unterschrift generiert oder hochlädt, schlägt der Storage-Upload fehl → "Fehler beim Speichern".

### Umsetzung

**Eine Migration** mit erweiterten Storage-Policies für `branding-logos`:

| Operation | Neue Regel |
|---|---|
| INSERT | Admin ODER Kunde (mit Branding-Zuordnung) |
| UPDATE | Admin ODER Kunde (mit Branding-Zuordnung) |
| DELETE | Admin ODER Kunde (mit Branding-Zuordnung) |

Die bestehenden Policies werden gedroppt und durch erweiterte ersetzt, die `is_kunde(auth.uid())` einschließen. Da der Bucket-Upload keinen direkten Branding-Bezug im Pfad hat, reicht die Prüfung `is_kunde(auth.uid())` (analog zu anderen Tabellen-Policies).

### Betroffene Stellen

| Bereich | Änderung |
|---|---|
| `supabase/migrations/...` | Storage RLS für `branding-logos` erweitern |

Kein Code-Change nötig — die Frontend-Logik ist korrekt, nur die Storage-Berechtigung fehlt.

