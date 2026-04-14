

## Plan: Aufträge von Mitarbeitern entziehen (Unassign)

### Problem
Der AssignmentDialog erlaubt aktuell nur das Hinzufügen von Zuweisungen. Bereits zugewiesene Checkboxen sind `disabled` und können nicht abgewählt werden. Es gibt keine Möglichkeit, einem Mitarbeiter einen Auftrag zu entziehen.

### Lösung

**Datei: `src/components/admin/AssignmentDialog.tsx`**

1. **Checkbox für bestehende Zuweisungen aktivieren**: Das `disabled`-Attribut entfernen, sodass auch bereits zugewiesene Einträge abgewählt werden können.

2. **Entfernte Zuweisungen in der saveMutation löschen**: Neben den neu hinzugefügten (`newlyAdded`) auch die entfernten (`removed`) berechnen -- das sind IDs die in `existingIds` sind aber nicht mehr in `selected`. Für jede entfernte ID wird ein gezieltes `DELETE` ausgeführt, das **beide Spalten** (`order_id` UND `contract_id`) matcht, sodass nur genau diese eine Zuweisung gelöscht wird.

3. **Visuelle Kennzeichnung**: Bereits zugewiesene aber zum Entfernen markierte Einträge (abgewählt) bekommen einen roten Rahmen/Hintergrund als Warnung.

4. **Bestätigungshinweis**: Im Footer wird angezeigt wie viele Zuweisungen entfernt werden, z.B. "2 Zuweisungen werden entzogen".

### Sicherheit

Das DELETE-Statement ist maximal spezifisch:
```sql
DELETE FROM order_assignments 
WHERE order_id = :sourceId AND contract_id = :targetId
```
Es wird immer nur die exakte Kombination aus `order_id` + `contract_id` gelöscht. Andere Mitarbeiter sind nicht betroffen.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | Checkbox entblockieren, DELETE-Logik für entfernte Zuweisungen, visuelle Warnung |

