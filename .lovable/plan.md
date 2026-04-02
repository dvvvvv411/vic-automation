

## Plan: Info-Notizen Feld für Ident-Sessions

### Änderungen

#### 1. SQL-Migration: `info_notes` Spalte

```sql
ALTER TABLE ident_sessions ADD COLUMN IF NOT EXISTS info_notes text DEFAULT '';
```

#### 2. AdminIdentDetail: Textarea hinzufügen

**Datei:** `src/pages/admin/AdminIdentDetail.tsx`

- Neuer State `infoNotes`, initialisiert aus `session.info_notes`
- Textarea mit Label "Info / Fragen und Antworten (optional)" in der Testdaten-Card
- `handleSave` um `info_notes: infoNotes` erweitern

#### 3. Mitarbeiter-Ansicht: Info anzeigen

**Datei:** `src/pages/mitarbeiter/AuftragDetails.tsx`

- Wenn `identSession.info_notes` vorhanden, Info-Box mit Titel "Info / Fragen und Antworten" anzeigen
- CSS-Klasse `whitespace-pre-wrap` damit Absätze und Zeilenumbrüche korrekt dargestellt werden

#### 4. Types aktualisieren

`src/integrations/supabase/types.ts` wird automatisch aktualisiert nach Migration.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| Neue SQL-Migration | `info_notes` text Spalte |
| `src/pages/admin/AdminIdentDetail.tsx` | State + Textarea + Save-Logik |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | Info-Box mit `whitespace-pre-wrap` |

