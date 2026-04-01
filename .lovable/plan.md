## Plan: Keine Löschungen mehr im AssignmentDialog + CASCADE-Schutz

### Problem

Der AssignmentDialog kann aktuell Zuweisungen löschen (wenn ein Admin jemanden abwählt und speichert). Durch `ON DELETE CASCADE` auf `ident_sessions` werden dabei auch Ident-Sessions unwiederbringlich gelöscht.

### Fix 1: DELETE-Logik komplett entfernen

**Datei:** `src/components/admin/AssignmentDialog.tsx`

Die gesamte Delete-Logik (Zeilen 129-141) wird entfernt. Der Dialog kann nur noch:
- Neue Mitarbeiter/Aufträge **hinzufügen**
- Bereits zugewiesene Einträge werden als checked angezeigt, aber ein Abwählen hat **keinen Effekt** — es wird nichts gelöscht

Konkret:
- `toRemove`-Berechnung und der zugehörige DELETE-Block werden entfernt
- Bereits zugewiesene Checkboxen werden **disabled** dargestellt (ausgegraut, nicht abwählbar), damit klar ist, dass man sie hier nicht entfernen kann
- Nur neu hinzugefügte werden beim Speichern eingefügt

### Fix 2: CASCADE → SET NULL (Defense-in-Depth)

**SQL-Migration** für `ident_sessions`:

```sql
ALTER TABLE ident_sessions ALTER COLUMN assignment_id DROP NOT NULL;
ALTER TABLE ident_sessions ALTER COLUMN order_id DROP NOT NULL;

ALTER TABLE ident_sessions
  DROP CONSTRAINT ident_sessions_assignment_id_fkey,
  ADD CONSTRAINT ident_sessions_assignment_id_fkey
    FOREIGN KEY (assignment_id) REFERENCES order_assignments(id) ON DELETE SET NULL;

ALTER TABLE ident_sessions
  DROP CONSTRAINT ident_sessions_order_id_fkey,
  ADD CONSTRAINT ident_sessions_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
```

Selbst wenn irgendwo anders im System ein Assignment gelöscht wird, bleibt die Ident-Session erhalten.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | DELETE-Logik entfernen, bestehende Zuweisungen als disabled anzeigen |
| Neue SQL-Migration | `ident_sessions` FK von CASCADE auf SET NULL |
